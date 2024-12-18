import type { ComponentInternals, Snippet } from "svelte";
import type { Action } from "svelte/action";
import { SvelteMap } from "svelte/reactivity";

import type { SchedulerYield } from "@/lib/scheduler.js";
import type { Schema, SchemaValue } from "@/core/schema.js";

import {
  ADDITIONAL_PROPERTY_KEY_ERROR,
  type AdditionalPropertyKeyError,
  type AdditionalPropertyKeyValidator,
  type FormValidator,
  type ValidationError,
} from "./validator.js";
import type { Components } from "./component.js";
import type { Widgets } from "./widgets.js";
import type { Translation } from "./translation.js";
import type { UiSchemaRoot } from "./ui-schema.js";
import type { Fields } from "./fields/index.js";
import type { Templates } from "./templates/index.js";
import type { Icons } from "./icons.js";
import type { InputsValidationMode } from "./validation.js";
import { groupErrors, type Errors, type FieldErrors } from "./errors.js";
import {
  setFromContext,
  type FormContext,
  type IconOrTranslationData,
} from "./context/index.js";
import { DefaultFormMerger, type FormMerger } from "./merger.js";
import { fields as defaultFields } from "./fields/index.js";
import { templates as defaultTemplates } from "./templates/index.js";
import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  DEFAULT_PSEUDO_ID_SEPARATOR,
  pathToId,
} from "./id-schema.js";
import IconOrTranslation from "./icon-or-translation.svelte";
import type { Config } from "./config.js";
import { createAdditionalPropertyKeyValidationSchema } from "./additional-property-key-validation-schema.js";

/**
 * @deprecated use `UseFormOptions2`
 */
export interface UseFormOptions<T, E> {
  validator: FormValidator<E>;
  schema: Schema;
  components: Components;
  translation: Translation;
  widgets: Widgets;
  uiSchema?: UiSchemaRoot;
  merger?: FormMerger;
  fields?: Fields;
  templates?: Templates;
  icons?: Icons;
  inputsValidationMode?: InputsValidationMode;
  disabled?: boolean;
  idPrefix?: string;
  idSeparator?: string;
  pseudoIdSeparator?: string;
  //
  initialValue?: T;
  initialErrors?:
    | Errors<E>
    | Map<string, FieldErrors<E>>
    | ValidationError<E>[];
  /**
   * The function to get the form data snapshot
   *
   * The snapshot is used to validate the form and passed to
   * `onSubmit` and `onSubmitError` handlers.
   *
   * @default () => $state.snapshot(formValue)
   */
  getSnapshot?: () => SchemaValue | undefined;
  /**
   * Submit handler
   *
   * Will be called when the form is submitted and form data
   * snapshot is valid
   *
   * Note that we rely on `validator.validateFormData` to check that the
   * `formData is T`. So make sure you provide a `T` type that
   * matches the validator check result.
   */
  onSubmit?: (value: T, e: SubmitEvent) => void;
  /**
   * Submit error handler
   *
   * Will be called when the form is submitted and form data
   * snapshot is not valid
   */
  onSubmitError?: (
    errors: Errors<E>,
    e: SubmitEvent,
    snapshot: SchemaValue | undefined
  ) => void;
  /**
   * Reset handler
   *
   * Will be called on form reset.
   *
   * By default it will clear the errors, set `isSubmitted` and `isChanged` state
   * to `false` and reset the form `value` to the `initialValue`.
   *
   * @default (e) => { e.preventDefault(); reset(); }
   */
  onReset?: (e: Event) => void;
  schedulerYield?: SchedulerYield;
}

export interface UseFormOptions2<T, E> extends UseFormOptions<T, E> {
  additionalPropertyKeyValidator?: AdditionalPropertyKeyValidator;
}

export interface FormState<T, E> {
  value: T | undefined;
  formValue: SchemaValue | undefined;
  errors: Errors<E>;
  isSubmitted: boolean;
  isChanged: boolean;
  validate(): Errors<E>;
  submit(e: SubmitEvent): void;
  reset(): void;
  updateErrorsByPath(
    path: Array<string | number>,
    update: (errors: FieldErrors<E>) => Omit<ValidationError<E>, "instanceId">[]
  ): void;
}

export interface FormAPI<T, E> extends FormState<T, E> {
  enhance: Action;
}

type Value = SchemaValue | undefined;

/**
 * @deprecated use `createForm2`
 */
export function createForm<T, E>(
  options: UseFormOptions<T, E>
): [FormContext, FormAPI<T, E>] {
  const [api, ctx] = createForm2(options);
  return [ctx, api];
}

type FormValueFromOptions<O extends UseFormOptions2<any, any>> =
  O extends UseFormOptions2<infer T, any> ? T : never;

type ValidatorErrorFromOptions<O extends UseFormOptions2<any, any>> =
  O extends UseFormOptions2<any, infer E> ? E : never;

export type FormApiAndContext<T, E> = [FormAPI<T, E>, FormContext];

export function createForm2<
  O extends UseFormOptions2<any, any>,
  T = FormValueFromOptions<O>,
  VE = ValidatorErrorFromOptions<O>,
  E = O extends {
    additionalPropertyKeyValidator: AdditionalPropertyKeyValidator;
  }
    ? VE | AdditionalPropertyKeyError
    : VE,
>(options: O): FormApiAndContext<T, E> {
  const merger = $derived(
    options.merger ?? new DefaultFormMerger(options.validator, options.schema)
  );

  let value = $state(
    merger.mergeFormDataAndSchemaDefaults(
      options.initialValue as Value,
      options.schema
    )
  );
  let errors: Errors<E> = $state(
    Array.isArray(options.initialErrors)
      ? groupErrors(options.initialErrors)
      : new SvelteMap(options.initialErrors)
  );
  let isSubmitted = $state(false);
  let isChanged = $state(false);

  const inputsValidationMode = $derived(options.inputsValidationMode ?? 0);
  const uiSchema = $derived(options.uiSchema ?? {});
  const disabled = $derived(options.disabled ?? false);
  const idPrefix = $derived(options.idPrefix ?? DEFAULT_ID_PREFIX);
  const idSeparator = $derived(options.idSeparator ?? DEFAULT_ID_SEPARATOR);
  const pseudoIdSeparator = $derived(
    options.pseudoIdSeparator ?? DEFAULT_PSEUDO_ID_SEPARATOR
  );
  const fields = $derived(options.fields ?? defaultFields);
  const templates = $derived(options.templates ?? defaultTemplates);
  const icons = $derived(options.icons ?? {});
  const schedulerYield: SchedulerYield = $derived(
    (options.schedulerYield ??
      (typeof scheduler !== "undefined" && "yield" in scheduler))
      ? scheduler.yield.bind(scheduler)
      : ({ signal }: Parameters<SchedulerYield>[0]) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if (signal.aborted) {
                reject(signal.reason);
              } else {
                resolve();
              }
            }, 0);
          })
  );
  const additionalPropertyKeyValidator = $derived.by(() => {
    const validator = options.additionalPropertyKeyValidator;
    return validator
      ? (config: Config, key: string) => {
          const instanceId = config.idSchema.$id;
          const messages = validator.validateAdditionalPropertyKey(key);
          errors.set(
            instanceId,
            messages.map((message) => ({
              instanceId,
              propertyTitle: config.title,
              message,
              error: ADDITIONAL_PROPERTY_KEY_ERROR as E,
            }))
          );
          return messages.length === 0;
        }
      : () => true;
  });

  const getSnapshot = $derived(
    options.getSnapshot ?? (() => $state.snapshot(value))
  );

  const validationSchema = $derived(
    options.additionalPropertyKeyValidator
      ? createAdditionalPropertyKeyValidationSchema(options.schema, [
          idSeparator,
          pseudoIdSeparator,
        ])
      : options.schema
  );

  function validateSnapshot(snapshot: SchemaValue | undefined) {
    return groupErrors(
      options.validator.validateFormData(validationSchema, snapshot)
    );
  }

  function submit(e: SubmitEvent) {
    isSubmitted = true;
    const snapshot = getSnapshot();
    errors = validateSnapshot(snapshot);
    if (errors.size === 0) {
      options.onSubmit?.(snapshot as T, e);
      isChanged = false;
      return;
    }
    options.onSubmitError?.(errors, e, snapshot);
  }

  const submitHandler = (e: SubmitEvent) => {
    e.preventDefault();
    submit(e);
  };

  function reset() {
    isSubmitted = false;
    isChanged = false;
    errors.clear();
    value = merger.mergeFormDataAndSchemaDefaults(
      options.initialValue as Value,
      options.schema
    );
  }

  // @deprecated
  // TODO: Call `options.onReset` inside `reset` instead of overwriting it
  const resetHandler = $derived(
    options.onReset ??
      ((e: Event) => {
        e.preventDefault();
        reset();
      })
  );

  return [
    {
      get value() {
        return getSnapshot() as T | undefined;
      },
      set value(v) {
        value = merger.mergeFormDataAndSchemaDefaults(
          v as Value,
          options.schema
        );
      },
      get formValue() {
        return value;
      },
      set formValue(v) {
        value = v;
      },
      get errors() {
        return errors;
      },
      set errors(v) {
        errors = v;
      },
      get isSubmitted() {
        return isSubmitted;
      },
      set isSubmitted(v) {
        isSubmitted = v;
      },
      get isChanged() {
        return isChanged;
      },
      set isChanged(v) {
        isChanged = v;
      },
      validate() {
        return validateSnapshot(getSnapshot());
      },
      submit,
      reset,
      updateErrorsByPath(path, update) {
        const instanceId = pathToId(idPrefix, idSeparator, path);
        const list = errors.get(instanceId);
        errors.set(
          instanceId,
          update(list ?? []).map((e) => ({ ...e, instanceId }))
        );
      },
      enhance(node) {
        $effect(() => {
          node.addEventListener("submit", submitHandler);
          node.addEventListener("reset", resetHandler);
          return () => {
            node.removeEventListener("submit", submitHandler);
            node.removeEventListener("reset", resetHandler);
          };
        });
      },
    },
    {
      get inputsValidationMode() {
        return inputsValidationMode;
      },
      get validateAdditionalPropertyKey() {
        return additionalPropertyKeyValidator;
      },
      get isSubmitted() {
        return isSubmitted;
      },
      get isChanged() {
        return isChanged;
      },
      set isChanged(v) {
        isChanged = v;
      },
      get errors() {
        return errors;
      },
      get schema() {
        return options.schema;
      },
      get uiSchema() {
        return uiSchema;
      },
      get disabled() {
        return disabled;
      },
      get idPrefix() {
        return idPrefix;
      },
      get idSeparator() {
        return idSeparator;
      },
      get idPseudoSeparator() {
        return pseudoIdSeparator;
      },
      get validator() {
        return options.validator;
      },
      get merger() {
        return merger;
      },
      get fields() {
        return fields;
      },
      get templates() {
        return templates;
      },
      get components() {
        return options.components;
      },
      get widgets() {
        return options.widgets;
      },
      get translation() {
        return options.translation;
      },
      get icons() {
        return icons;
      },
      get schedulerYield() {
        return schedulerYield;
      },
      IconOrTranslation,
      iconOrTranslation: ((
        internals: ComponentInternals,
        data: IconOrTranslationData | (() => IconOrTranslationData)
      ) => {
        IconOrTranslation(
          internals,
          // Looks like during SSR the `data` is not a getter function
          // TODO: Clarify how to detect SSR in Svelte (not SvelteKit)
          typeof data === "function"
            ? {
                get data() {
                  return data();
                },
              }
            : {
                data,
              }
        );
      }) as unknown as Snippet<[IconOrTranslationData]>,
    },
  ];
}

/**
 * Create a FormAPI and set form context
 * @deprecated use `useForm2`
 */
export function useForm<T, E>(options: UseFormOptions<T, E>): FormAPI<T, E> {
  return useForm2(options);
}

/**
 * Create a FormAPI and set form context
 */
export function useForm2<O extends UseFormOptions2<any, any>>(options: O) {
  const [api, ctx] = createForm2(options);
  setFromContext(ctx);
  return api;
}
