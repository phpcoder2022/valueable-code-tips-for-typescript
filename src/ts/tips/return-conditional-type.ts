export const returnConditionalType = <CheckedType>() => (
  <
  ValueForChecking,
  TrueResult,
  FalseResult,
>(
    valueForChecking: ValueForChecking,
    checkingFunc: (value: ValueForChecking) => CheckedType | typeof FalseResultSymbol,
    createTrueResult: (value: CheckedType) => TrueResult,
    createFalseResult: (value: Exclude<ValueForChecking, CheckedType>) => FalseResult,
  ): ValueForChecking extends CheckedType ? TrueResult : FalseResult => {
    const checkedValue = checkingFunc(valueForChecking);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return ((checkedValue !== FalseResultSymbol)
      ? createTrueResult(checkedValue)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      : createFalseResult(valueForChecking as Exclude<ValueForChecking, CheckedType>)
    ) as ValueForChecking extends CheckedType ? TrueResult : FalseResult;
  }
);
export const FalseResultSymbol = Symbol('FalseResultSymbol');
export const NeverSymbol = Symbol('NeverSymbol');
