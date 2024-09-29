import type { Snippet, Component as SvelteComponent } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

import type { Get } from "@/lib/types";

import type { FormContext } from "./context";
import { createMessage, type Config } from "./config";

export interface FormComponentProps {
  form: HTMLFormElement | undefined;
  onsubmit: (e: SubmitEvent) => void;
  children: Snippet;
}

export interface ButtonType {
  submit: {};
  "object-property-add": {};
  "object-property-remove": {};
  "array-item-add": {};
  "array-item-move-down": {};
  "array-item-move-up": {};
  "array-item-copy": {};
  "array-item-remove": {};
}

export interface ButtonComponentProps {
  type: keyof ButtonType;
  disabled: boolean;
  onclick?: (e: Event) => void;
  // For submit button
  attributes?: HTMLButtonAttributes | undefined;
  children?: Snippet;
}

export interface LayoutType {
  "root-field": {};
  field: {};
  "field-meta": {};
  "field-content": {};
  "object-field": {};
  "object-field-meta": {};
  "object-properties": {};
  "object-property": {};
  "object-property-key-input": {};
  "object-property-content": {};
  "object-property-controls": {};
  "array-field": {};
  "array-field-meta": {};
  "array-items": {};
  "array-item": {};
  "array-item-content": {};
  "array-item-controls": {};
}

export interface LayoutComponentProps {
  type: keyof LayoutType;
  children: Snippet;
  attributes?: HTMLAttributes<HTMLDivElement> | undefined;
}

export interface AlertType {
  error: {};
}

export interface AlertComponentProps {
  type: keyof AlertType;
  title?: string;
  children: Snippet;
}

export interface ParentTemplateType {
  field: {};
  object: {};
  array: {};
}

export interface TitleComponentProps {
  type: keyof ParentTemplateType;
  title: string;
  forId: string;
  required: boolean;
}

export interface DescriptionComponentProps {
  type: keyof ParentTemplateType;
  description: string;
}

export interface HelpComponentProps {
  help: string;
}

export interface ComponentsAndProps {
  form: FormComponentProps;
  button: ButtonComponentProps;
  layout: LayoutComponentProps;
  alert: AlertComponentProps;
  title: TitleComponentProps;
  description: DescriptionComponentProps;
  help: HelpComponentProps;
}

export interface ComponentBindings {
  form: "form";
}

export type ComponentType = keyof ComponentsAndProps;

export type ComponentProps<T extends ComponentType> = ComponentsAndProps[T] & {
  config: Config;
};

export type Component<T extends ComponentType> = SvelteComponent<
  ComponentProps<T>,
  {},
  Get<ComponentBindings, T, "">
>;

export type Components = <T extends ComponentType>(
  type: T,
  config: Config
) => Component<T> | undefined;

function getComponentInternal<T extends ComponentType>(
  ctx: FormContext<unknown>,
  type: T,
  config: Config
): Component<T> | undefined {
  const component = config.uiSchema["ui:components"]?.[type];
  switch (typeof component) {
    case "undefined":
      return ctx.components(type, config);
    case "string":
      return ctx.components(component as T, config);
    default:
      return component as Component<T>;
  }
}

export function getComponent<T extends ComponentType>(
  ctx: FormContext<unknown>,
  type: T,
  config: Config
): Component<T> {
  // @ts-expect-error TODO: improve `createMessage` type
  return (
    getComponentInternal(ctx, type, config) ??
    createMessage(
      `Component "${
        config.uiSchema["ui:components"]?.[type] ?? type
      }" not found`
    )
  );
}
