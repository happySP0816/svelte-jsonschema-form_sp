import type { Schema } from "@/core/index.js";

import type { IdSchema } from "./id-schema.js";
import type { UiOptions, UiSchema } from "./ui-schema.js";

export interface Config<V = unknown> {
  name: string;
  title: string;
  schema: Schema;
  uiSchema: UiSchema;
  idSchema: IdSchema<V>;
  uiOptions: UiOptions | undefined;
  required: boolean;
}
