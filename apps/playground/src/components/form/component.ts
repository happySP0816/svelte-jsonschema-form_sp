import type { Component as SvelteComponent } from "svelte";
import type {
  HTMLAttributes,
  HTMLButtonAttributes,
  HTMLFormAttributes,
} from "svelte/elements";

import type { Get } from "@/lib/types";

import type { UiSchema } from "./ui-schema";

export interface FormComponentProps extends HTMLFormAttributes {
  form: HTMLFormElement | undefined;
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

export interface ButtonComponentProps
  extends Omit<HTMLButtonAttributes, "type"> {
  type: keyof ButtonType;
  disabled: boolean;
}

export interface LayoutType {
  "root-field": {};
  field: {};
  "field-content": {};
  "object-field": {};
  "object-properties": {};
  "object-property": {};
  "object-property-key-input": {};
  "object-property-content": {};
  "object-property-controls": {};
  "array-field": {};
  "array-items": {};
  "array-item": {};
  "array-item-content": {};
  "array-item-controls": {};
}

export interface LayoutComponentProps extends HTMLAttributes<HTMLDivElement> {
  type: keyof LayoutType;
}

export interface AlertType {
  error: {};
}

export interface AlertComponentProps extends HTMLAttributes<HTMLDivElement> {
  type: keyof AlertType;
  title?: string;
}

export interface ParentTemplateType {
  field: {};
  object: {};
  array: {};
}

export interface TitleComponentProps extends HTMLAttributes<HTMLElement> {
  type: keyof ParentTemplateType;
  title: string;
  forId: string;
  required: boolean;
}

export interface DescriptionComponentProps extends HTMLAttributes<HTMLElement> {
  type: keyof ParentTemplateType;
  description: string;
}

export interface HelpComponentProps extends HTMLAttributes<HTMLElement> {
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

export type ComponentProps<T extends ComponentType> = ComponentsAndProps[T];

export type Component<T extends ComponentType> = SvelteComponent<
  ComponentProps<T>,
  {},
  Get<ComponentBindings, T, "">
>;

export type Components = <T extends ComponentType>(
  type: T,
  uiSchema: UiSchema
) => Component<T> | undefined;
