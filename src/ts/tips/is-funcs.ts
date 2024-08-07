/** https://safareli.com/blog/stricter-and-safer-type-guards-in-typescript/ */
export const is = <Wide, Narrow extends Wide>(
  predicate: (value: Wide) => Narrow | typeof isnt,
) => (value: Wide): value is Narrow => predicate(value) !== isnt;
export const isnt = Symbol('@is/isn\'t');

export const createStrictIs = <
  Wide,
  Narrow extends Wide,
>() => <Return extends Narrow | typeof isnt>(
    predicate: (value: Wide) => Return,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _check: [Narrow | typeof isnt] extends [Return] ? 'complete' : never,
  ) => (value: Wide): value is Narrow => predicate(value) !== isnt;

export const createDetailsStrictIs = <
  Wide,
  Narrow extends Wide,
>() => <Return extends Narrow | typeof isnt>(
    predicate: (value: Wide) => Return,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _check: IdentityFunc & ((input: NoInfer<Narrow | typeof isnt>) => NoInfer<Return>),
  ) => (value: Wide): value is Narrow => predicate(value) !== isnt;
const IdentityFuncSymbol = Symbol('IdentityFuncSymbol');
type IdentityFunc = {
  <Type>(input: Type): Type,
  [IdentityFuncSymbol]: true,
};
export const identityFunc = ((): IdentityFunc => {
  const func = <Type>(input: Type): Type => input;
  func[IdentityFuncSymbol] = true as const;
  return func;
})();
