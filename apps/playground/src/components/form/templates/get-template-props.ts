import type { Config } from "../config";

export function getTemplateProps({ title, uiOptions, schema }: Config) {
  return {
    title: uiOptions?.title ?? schema.title ?? title,
    showMeta: uiOptions?.hideTitle !== true,
    description: uiOptions?.description ?? schema.description,
  };
}
