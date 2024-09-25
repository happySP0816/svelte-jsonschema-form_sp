export type TransformationConfig<I, O> = {
  input: () => I;
  transform: (v: I) => O;
  update?: (v: O) => void;
};

export function createTransformation<I, O>(config: TransformationConfig<I, O>) {
  let updatedBySuccessor = false;
  let updatedValue = $state.raw<O>();
  const transformed = $derived.by(() => {
    const value = config.input();
    const updated = updatedValue;
    if (updatedBySuccessor) {
      updatedBySuccessor = false;
      return updated as O;
    }
    return config.transform(value);
  });
  return {
    get value() {
      return transformed;
    },
    set value(value: O) {
      updatedBySuccessor = true;
      updatedValue = value;
      config.update?.(value);
    },
  };
}
