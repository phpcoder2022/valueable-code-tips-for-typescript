export type IsTypeEqual<T1, T2> = IsNotAny<T1> extends false ? false : (
  IsNotAny<T2> extends false ? false : (
    [T1] extends [T2] ? ([T2] extends [T1] ? true : false) : false
  )
);

export type IsTypeAssignable<T1, T2> = IsNotAny<T1> extends false ? false : (
  IsNotAny<T2> extends false ? false : (
    [T2] extends [T1] ? true : false
  )
);

/**
 * Returns `false` if `any` is specified, otherwise returns `true`.
 * @see https://stackoverflow.com/a/49928360/3406963
 */
export type IsNotAny<T> = 0 extends (1 & T) ? false : true;

/**
 * Returns true for false and vice versa.
 */
export type Not<T> = [T] extends [true] ? false : true;

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
export function typeAssert<_T extends true>(): void {
  void 0;
}
