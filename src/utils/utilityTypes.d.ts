type MergeTypes<
  A,
  B,
  AnotB = Omit<A, keyof B>,
  BnotA = Omit<B, keyof A>,
  AndB = A extends AnotB ? Omit<A, keyof AnotB> : never
> = {
  [K in keyof AnotB | keyof BnotA | keyof AndB]: K extends keyof AnotB
    ? AnotB[K]
    : K extends keyof BnotA
    ? BnotA[K]
    : K extends keyof A
    ? K extends keyof B
      ? A[K] | B[K]
      : never
    : never;
};

type MergeMultiple<T extends any[], B = T extends [any, ...infer U] ? U : never> = T extends { length: 0 }
  ? {}
  : T extends { length: 1 }
  ? T
  : T extends { length: 2 }
  ? MergeTypes<T[0], T[1]>
  : B extends any[]
  ? MergeTypes<T[0], MergeMultiple<B>>
  : never;
