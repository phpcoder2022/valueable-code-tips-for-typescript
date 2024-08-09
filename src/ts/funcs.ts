import { IsTypeEqual, typeAssert } from './type-assertions';

/** Manual type guard */
export const typedIncludes = <Arr extends unknown[] | readonly unknown[]>(
  arr: Arr,
  valueForSearch: unknown,
): valueForSearch is Arr[number] => arr.includes(valueForSearch);

const testIncludesArr = [1, 3, 5] as const;
let anyNumber = 3; // eslint-disable-line prefer-const
const numberFromUnion = typedIncludes(testIncludesArr, anyNumber) ? anyNumber : null;
typeAssert<IsTypeEqual<NonNullable<typeof numberFromUnion>, 1 | 3 | 5>>();

export const tuple = <Args extends unknown[]>(...args: Args): Args => args;
