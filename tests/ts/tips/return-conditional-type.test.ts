import { createDetailsStrictIs, identityFunc, isnt } from '../../../src/ts/tips/is-funcs';
import {
  FalseResultSymbol,
  NeverSymbol,
  returnConditionalType,
} from '../../../src/ts/tips/return-conditional-type';
import { excludedKeys } from '../../../src/ts/consts';
import { typedIncludes } from '../../../src/ts/funcs';
import { isObj } from '../../../src/ts/type-guards';

describe('entries', () => {
  type OldEntryType = 'a' | 'b' | 'c';
  type OldEntry = {
    id: number,
    type: OldEntryType
    title: string,
  };
  type NewEntry = {
    id: string,
    type: OldEntryType | 'outer'
    title: string,
    origin: string,
    description: string,
  };

  /** Stub realization */
  const getOldEntry = (id: number) => ({ id, type: 'a', title: 'abc' } as const);
  /** Stub realization */
  const getNewEntry = (id: string) => (
    { id, type: 'a', title: 'abc', origin: 'ab', description: 'any desc' } as const
  );

  const getEntry = <Id extends number | string>(id: Id): Id extends number ? OldEntry : NewEntry => (
    returnConditionalType<number>()(
      id,
      id => typeof id === 'number' ? id : FalseResultSymbol,
      getOldEntry,
      getNewEntry,
    )
  );
  const isOldEntryType = createDetailsStrictIs<unknown, OldEntryType>()(value => (
    (value === 'a' || value === 'b' || value === 'c') ? value : isnt
  ), identityFunc);
  const isOldEntry = createDetailsStrictIs<unknown, OldEntry>()(value => {
    if (!isObj(value)) return isnt;
    const oldEntry: Partial<OldEntry> = value;
    const { id, title, type } = oldEntry;
    if (!(typeof id === 'number' && typeof title === 'string' && isOldEntryType(type))) return isnt;
    return { id, title, type };
  }, identityFunc);
  const isNewEntry = createDetailsStrictIs<unknown, NewEntry>()(value => {
    if (!isObj(value)) return isnt;
    const newEntry: Partial<NewEntry> = value;
    const { id, title, type, origin, description } = newEntry;
    if (!(typeof id === 'string'
      && typeof title === 'string'
      && (isOldEntryType(type) || type === 'outer')
      && typeof origin === 'string'
      && typeof description === 'string'
    )) return isnt;
    return { id, title, type, origin, description };
  }, identityFunc);

  const testData: ([number, 'old'] | [string, 'new'])[] = [
    [0, 'old'], [1, 'old'], ['ID-1234-5678', 'new'],
  ];
  testData.forEach(([id, expectedResult]) => {
    test(JSON.stringify([id, expectedResult]), () => {
      const entry = getEntry(id);
      const actualResult = isOldEntry(entry) ? 'old' : isNewEntry(entry) ? 'new' : 'error';
      expect([id, actualResult]).toStrictEqual([id, expectedResult]);
    });
  });
});

describe('ab strings', () => {
  const getABString = <Input extends number>(input: Input): Input extends 0 ? 'a' : 'b' => {
    const cond = 0;
    return returnConditionalType<0>()(
      input,
      input => input === cond ? cond : FalseResultSymbol,
      () => 'a',
      () => 'b',
    );
  };

  const testData: ([0, 'a'] | [number, 'b'])[] = [[0, 'a'], [-1, 'b'], [1, 'b']];
  testData.forEach(([input, expectedResult]) => {
    test(JSON.stringify([input, expectedResult]), () => {
      expect([input, expectedResult]).toStrictEqual([input, getABString(input)]);
    });
  });
});

describe('get object fields', () => {
  type XY = { x: 0 | 1 | 2, y: string };
  const getObjField = <Obj extends { x: number }>(obj: Obj): Obj extends XY ? Obj['y'] : Obj['x'] => (
    returnConditionalType<XY>()(
      obj,
      obj => isXY(obj) ? obj : FalseResultSymbol,
      obj => obj.y,
      obj => obj.x,
    )
  );
  const allowedValuesForXFromXY = [0, 1, 2] as const;
  const isXY = createDetailsStrictIs<unknown, XY>()(value => {
    if (!(isObj(value) && 'x' in value && 'y' in value)) return isnt;
    const { x, y } = value;
    if (!(typedIncludes(allowedValuesForXFromXY, x) && typeof y === 'string')) return isnt;
    return { x, y };
  }, identityFunc);

  const testData: ([{ x: number }, number] | [XY, string])[] = [
    [{ x: 0 }, 0], [{ x: -1e-16 }, -1e-16],
    [{ x: 0, y: 'zero' }, 'zero'], [{ x: 1, y: 'one' }, 'one'], [{ x: 2, y: 'two' }, 'two'],
  ];
  testData.forEach(([obj, expectedResult]) => {
    test(JSON.stringify([obj, expectedResult]), () => {
      expect([obj, getObjField(obj)]).toStrictEqual([obj, expectedResult]);
    });
  });
});

describe('prevent prototype pollution', () => {
  const excludeKeys = <Key extends string>(keys: Key[]):
  (Key extends typeof excludedKeys[number] ? never : Key)[] => {
    const resultKeys: (Key extends typeof excludedKeys[number] ? never : Key)[] = [];
    for (const key of keys) {
      const resultKey = excludeKey(key);
      if (resultKey !== NeverSymbol) resultKeys.push(resultKey);
    }
    return resultKeys;
  };

  const keyPicker = (key: string) => typedIncludes(excludedKeys, key) ? key : FalseResultSymbol;
  const throwError = () => { throw new Error(`${excludeKey.name}: incorrect key`); };
  const returnFunc = returnConditionalType<typeof excludedKeys[number]>();
  /** Use ternary operator instead of throwing real exception for better performance */
  const excludeKey = <Key extends string>(key: Key):
  (Key extends typeof excludedKeys[number] ? never : Key) | typeof NeverSymbol => {
    return keyPicker(key) !== FalseResultSymbol
      ? NeverSymbol
      : returnFunc(key, keyPicker, throwError, identityFunc);
  };

  const testData: [string[], string[]][] = [
    [['a', 'b', 'c'], ['a', 'b', 'c']],
    [['0', '1', 'proto'], ['0', '1', 'proto']],
    [['_proto_', '__proto', '_proto__'], ['_proto_', '__proto', '_proto__']],
    [['a', '__proto__'], ['a']],
    [['__proto__', 'prototype'], []],
  ];
  testData.forEach(([input, expectedResult]) => {
    test(JSON.stringify(input), () => {
      expect(excludeKeys(input)).toStrictEqual(expectedResult);
    });
  });
});
