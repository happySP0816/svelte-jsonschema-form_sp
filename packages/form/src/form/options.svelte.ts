import { deepEqual } from "@/lib/deep-equal.js";
import { isObject } from '@/lib/object.js';

import type { EnumOption, SchemaArrayValue, SchemaValue } from '@/core/index.js';

export interface OptionsMapper<V> {
  fromValue: (value: SchemaValue | undefined) => V;
  toValue: (value: V) => SchemaValue | undefined;
}

export function indexMapper(options: EnumOption<SchemaValue>[]): OptionsMapper<number> {
  const map = new Map(options.map((option, index) => [option.value, index]));
  return {
    fromValue(value: SchemaValue | undefined) {
      if (value === undefined) {
        return -1;
      }
      const index = map.get(value);
      if (index !== undefined) {
        return index;
      }
      if (!isObject(value)) {
        return options.findIndex((option) => option.value === value);
      }
      return options.findIndex((option) => deepEqual(option.value, value));
    },
    toValue(index: number) {
      return options[index]?.value;
    },
  };
}

export function stringIndexMapper(options: EnumOption<SchemaValue>[]): OptionsMapper<string> {
  const { fromValue, toValue } = indexMapper(options);
  return {
    fromValue(value) {
      return String(fromValue(value));
    },
    toValue(value) {
      return toValue(Number(value));
    },
  };
}

export function singleOption<V>({
  mapper,
  value,
  update,
}: {
  mapper: () => OptionsMapper<V>,
  value: () => SchemaValue | undefined,
  update: (value: SchemaValue | undefined) => void,
}) {
  const { fromValue, toValue } = $derived(mapper());
  return {
    get value() {
      return fromValue(value());
    },
    set value(v) {
      update(toValue(v));
    }
  }
}

export function multipleOptions<V>({
  mapper,
  value,
  update,
}: {
  mapper: () => OptionsMapper<V>,
  value: () => SchemaArrayValue | undefined,
  update: (value: SchemaArrayValue) => void,
}) {
  const { fromValue, toValue } = $derived(mapper());
  return {
    get value() {
      return value()?.map(fromValue) ?? [];
    },
    set value(v) {
      update(v.map(toValue));
    }
  }
}
