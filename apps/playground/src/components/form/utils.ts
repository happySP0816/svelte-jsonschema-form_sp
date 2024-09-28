import type { Component, ComponentType } from "./component";
import type { FormContext } from "./context";
import type { UiOptions, UiSchema } from "./ui-schema";
import type { Field, FieldType } from "./fields";
import {
  isSelect as isSelectInternal,
  isMultiSelect as isMultiSelectInternal,
  retrieveSchema as retrieveSchemaInternal,
  getDefaultFormState as getDefaultFormStateInternal,
  type Schema,
  type SchemaValue,
} from "./schema";
import type { CompatibleWidgetType, Widget, WidgetType } from "./widgets";
import { toIdSchema as toIdSchemaInternal, type IdSchema } from "./id-schema";
import type { Template, TemplateType } from "./templates";
import Message from "./error-message.svelte";

const createMessage =
  (message: string): typeof Message =>
  (internal) =>
    Message(internal, { message });

export function retrieveSchema<T extends SchemaValue>(
  ctx: FormContext<T>,
  schema: Schema,
  formData: T | undefined
) {
  return retrieveSchemaInternal(ctx.validator, schema, ctx.schema, formData);
}

export function getUiOptions(ctx: FormContext<unknown>, uiSchema: UiSchema) {
  const globalUiOptions = ctx.uiSchema["ui:globalOptions"];
  const uiOptions = uiSchema["ui:options"];
  return globalUiOptions !== undefined
    ? { ...globalUiOptions, ...uiOptions }
    : uiOptions;
}

function getWidgetInternal<T extends WidgetType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Widget<CompatibleWidgetType<T>> | undefined {
  const widget = uiSchema["ui:widget"];
  switch (typeof widget) {
    case "undefined":
      return ctx.widgets(type);
    case "string":
      return ctx.widgets(widget as T);
    default:
      return widget as Widget<CompatibleWidgetType<T>>;
  }
}

export function getWidget<T extends WidgetType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Widget<CompatibleWidgetType<T>> {
  return (
    getWidgetInternal(ctx, type, uiSchema) ??
    (createMessage(
      `Widget "${uiSchema["ui:widget"] ?? type}" not found`
    ) as Widget<CompatibleWidgetType<T>>)
  );
}

function getFieldInternal<T extends FieldType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Field<T> | undefined {
  const field = uiSchema["ui:field"];
  switch (typeof field) {
    case "undefined":
      return ctx.fields(type, uiSchema);
    case "string":
      return ctx.fields(field as T, uiSchema);
    default:
      return field as Field<T>;
  }
}

export function getField<T extends FieldType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Field<T> {
  return (
    getFieldInternal(ctx, type, uiSchema) ??
    (ctx.fields("unsupported", uiSchema) as Field<T>) ??
    createMessage(`Field "${uiSchema["ui:field"] ?? type}" not found`)
  );
}

export function getTemplateProps(
  _: FormContext<unknown>,
  name: string,
  schema: Schema,
  uiOptions: UiOptions | undefined
) {
  return {
    title: uiOptions?.title ?? schema.title ?? name,
    showMeta: uiOptions?.hideTitle !== true,
    description: uiOptions?.description ?? schema.description,
  };
}

function getTemplateInternal<T extends TemplateType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Template<T> | undefined {
  const template = uiSchema["ui:templates"]?.[type];
  switch (typeof template) {
    case "undefined":
      return ctx.templates(type, uiSchema);
    case "string":
      return ctx.templates(template as T, uiSchema);
    default:
      return template as Template<T>;
  }
}

export function getTemplate<T extends TemplateType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Template<T> {
  return (
    getTemplateInternal(ctx, type, uiSchema) ??
    (createMessage(
      `Template "${uiSchema["ui:templates"]?.[type] ?? type}" not found`
    ) as Template<T>)
  );
}

function getComponentInternal<T extends ComponentType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Component<T> | undefined {
  const component = uiSchema["ui:components"]?.[type];
  switch (typeof component) {
    case "undefined":
      return ctx.components(type, uiSchema);
    case "string":
      return ctx.components(component as T, uiSchema);
    default:
      return component as Component<T>;
  }
}

export function getComponent<T extends ComponentType>(
  ctx: FormContext<unknown>,
  type: T,
  uiSchema: UiSchema
): Component<T> {
  // @ts-expect-error TODO: improve `createMessage` type
  return (
    getComponentInternal(ctx, type, uiSchema) ??
    createMessage(
      `Component "${uiSchema["ui:components"]?.[type] ?? type}" not found`
    )
  );
}

export function isSelect(ctx: FormContext<unknown>, schema: Schema) {
  return isSelectInternal(ctx.validator, schema, ctx.schema);
}

export function isMultiSelect(ctx: FormContext<unknown>, schema: Schema) {
  return isMultiSelectInternal(ctx.validator, schema, ctx.schema);
}

export function toIdSchema<T extends SchemaValue>(
  ctx: FormContext<T>,
  schema: Schema,
  id?: string,
  formData?: T
): IdSchema<T> {
  return toIdSchemaInternal(
    ctx.validator,
    schema,
    ctx.idPrefix,
    ctx.idSeparator,
    [],
    id,
    ctx.schema,
    formData
  );
}

export function getDefaultFormState<T extends SchemaValue>(
  ctx: FormContext<T>,
  schema: Schema,
  formData: T | undefined
) {
  return getDefaultFormStateInternal(
    ctx.validator,
    schema,
    formData,
    ctx.schema,
    false
  );
}
