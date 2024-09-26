import type { Field, Fields, FieldType } from "./model";

import { Array } from './array'
import Root from "./root.svelte";
import Null from './null.svelte'
import String from './string.svelte'
import Number from './number.svelte'
import Integer from './integer.svelte';
import Boolean from './boolean.svelte';
import Unsupported from './unsupported.svelte';
import Object from './object.svelte';

export const fieldsRegistry: { [T in FieldType]: Field<T> } = {
  root: Root,
  null: Null,
  string: String,
  integer: Integer,
  number: Number,
  boolean: Boolean,
  object: Object,
  array: Array,
  unsupported: Unsupported,
};

export const fields: Fields = (type) => fieldsRegistry[type]
