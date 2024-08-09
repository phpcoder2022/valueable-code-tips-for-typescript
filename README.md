# Code tips

## Summary

1. [Static checking type guards](#static-checking-type-guards)
1. [Returning of conditional with static checking](#returning-of-conditional-with-static-checking)

## Static checking type guards

User type guards don't static check in TypeScript by default.

```typescript
type User = {
  username: string,
  role: 'regular user' | 'moderator' | 'administrator'
};

const isUser = (value: unknown): value is User => true; // ts doesn't write error

```
[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH3wkqKAAoAbsS65euQgDWhBwA7oQAlFRePtD6sASoAHxQtL7mUAD0GSlwUAocEHCEfMBQIfTA0EiciEA)

Irakli Safareli suggests [his solution](https://safareli.com/blog/stricter-and-safer-type-guards-in-typescript/) of this problem. The point of the technique is that manual type guards are not created directly, but made by special function `is`. It is a wonderful technique, and it allows return strictness to code with separate type checks.

```typescript
type User = {
  username: string,
  role: 'regular user' | 'moderator' | 'administrator'
};

const is = <Wide, Narrow extends Wide>(
  predicate: (value: Wide) => Narrow | typeof isnt,
) => (value: Wide): value is Narrow => predicate(value) !== isnt;
const isnt = Symbol('@is/isn\'t');

const isObj = is<unknown, object>(value => (
  typeof value === 'object' && value ? value : isnt
));

const isUser = is<unknown, User>(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    && (role === 'regular user' || role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
});
```

[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH2ooAHgDqdJcygA5MZwB3KAgAD2AIQgU4KA8lAD4ACjYwQQU6axVeBIA3Yi5cXliIAEpUON9-DiDZUEgOADNHOEJgVlKUcpy8gqoi4qpc-OgnP0RAsqgUiDSM8K6h0oBCFDR9Fstbe2AmlucAZRBSACNuBL4AAX0AejWAHT5gPmLLGzsHfQB5I4ArZ30XXCEADWhCqhG8HB+EGswESgwKEySOFqEAaUHh0BWaD4kO+0MeUAAZIT0d1oAB+UlDKBUNbATDFZ5WTbvODwJB-OAA4GggLg2AEOFkiZYHB0RoJRYJT4-eYFUrE-gSIhkCBSBhUhGKgTcNWOQiakqlQTAXBEHbASw4FnbdB4AgkcjeTg8KCmZwYq2OCVSlFo5WOzErfgGBiMEw4HCKhIuoPYwTCUTiAgaWSx1DBvjyJSGVTqGRp3UZ7HaXSEfS0IzqYpsRnsCCm810r0ms0Gu0B1XOosWMxMzBAA)

However, problem exists in TypeScript even after this solution. This technique doesn't catch false-negative errors. Thus, you need unit tests for any manual type guard. But unit tests check only cases that you wrote. If you added a variant to type after, and forgot to add it to type guard, then you will forget to add it to the unit test too.

```typescript
const isUser = is<unknown, User>(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    // Skipped one variant. Ts doesn't write error.
    && (role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
});
```

[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH2ooAHgDqdJcygA5MZwB3KAgAD2AIQgU4KA8lAD4ACjYwQQU6axVeBIA3Yi5cXliIAEpUON9-DiDZUEgOADNHOEJgVlKUcpy8gqoi4qpc-OgnP0RAsqgUiDSM8K6h0oBCFDR9Fstbe2AmlucAZRBSACNuBL4AAX0AejWAHT5gPmLLGzsHfQB5I4ArZ30XXCEADWhCqhG8HB+EGswESgwKEySOFqEAaUHh0BWaD4kO+0MeUAAZIT0d1oAB+UlDKBUNbATDFZ5WTbvODwJB-OAA4GggLg2AEOFkiZYHB0RoJRYJT4-eYFUrE-gSIhkCBSBhUhGKgTcNWOQiakqlQTAXBEHbASw4FnbdB4AgkcjeTg8KCmZwYq2OCVSlFo5WOzErfgGBiMEw4HBXK5QPZAuhgSAKKB2aC5ejEFoAOigABVogoOBBmg8oAF6OFgmM1Fm2DhFQkXUHsfIlIZVOoZLIm6hg1odHoDEZ1MU2Iz2BBTea6V6TWaDXaA6rnbq3ZZTEygA)

False-negative errors may be eliminated using the conditional type

```typescript
export const createStrictIs = <
  Wide,
  Narrow extends Wide,
>() => <Return extends Narrow | typeof isnt>(
    predicate: (value: Wide) => Return,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _check: [Narrow | typeof isnt] extends [Return] ? 'complete' : never,
  ) => (value: Wide): value is Narrow => predicate(value) !== isnt;

const isObj = is<unknown, object>(value => (
  typeof value === 'object' && value ? value : isnt
));

const isUserStrict = createStrictIs<unknown, User>()(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    && (role === 'regular user' || role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
}, 'complete');
```

[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH2ooAHgDqdJcygA5MZwB3KAgAD2AIQgU4KA8lAD4ACjYwQQU6axVeBIA3Yi5cXliIAEpUON9-DiDZUEgOADNHOEJgVlKUcpy8gqoi4qpc-OgnP0RAsqgUiDSM8K6h0oBCFDR9Fstbe2AmlucAZRBSACNuBL4AAX0AejWAHT5gPmLLTFCwNW3Nh2tBTL3adLAACS0TQLjYRVYOFG41C4Ui0UhmES7XKLgAShBgLgiMEwhEohUxlUZFBahAGjtgIk2DgpjNMlR5j0Yp4ShNMdiiFCcFArldgnAuAxgABaNJwYhHHiiwhw0XCuVQc7kuA-OhgMUQIUiq6EDii3CECQKUW5RBwWlQAD61gAFhBrABrKgAbRhJJq4ApjTWwAAunj4YTXZycYRAwB+fi2UhgHjhKRUOXZJA81FQZmFNn9KCDApNInjDqTVLpTJZpYrKkvGx2Bz6ADyRwAVs59C4jU79QFCN4OK3HdSsxMkjhyZT89AVmg+AOW0OpAAyJd57rQaNTqBUP2YYrPKxfbb6eBIf70azbNA-CB-AGXkGdwjdqp92AEFEjktYHB0RoJRYEibVtKygFd+AkIgyAgKQGDXIYwNXARuBgxxCHggp93YLFwxrNgjwwPACBIchvE4HgoFMZwp0sX9-0AidGkgkjp2rPgDAYRgTF5RDM3I1jZ0EYRRHEAgNFkfjUDY+QlEMVR1BkCSUKk2dtF0Qh9FoIx1GKNgsMELl0L9WjsMMwjmOgsjlIsMxvD4WN4yxGCDyAA)

Ts write an error in the case when one variant was skipped

[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH2ooAHgDqdJcygA5MZwB3KAgAD2AIQgU4KA8lAD4ACjYwQQU6axVeBIA3Yi5cXliIAEpUON9-DiDZUEgOADNHOEJgVlKUcpy8gqoi4qpc-OgnP0RAsqgUiDSM8K6h0oBCFDR9Fstbe2AmlucAZRBSACNuBL4AAX0AejWAHT5gPmLLTFCwNW3Nh2tBTL3adLAACS0TQLjYRVYOFG41C4Ui0UhmES7XKLgAShBgLgiMEwhEohUxlUZFBahAGjtgIk2DgpjNMlR5j0Yp4ShNMdiiFCcFArldgnAuAxgABaNJwYhHHiiwhw0XCuVQc7kuA-OhgMUQIUiq6EDii3CECQKUW5RBwWlQAD61gAFhBrABrKgAbRhJJq4ApjTWwAAunj4YTXZycYRAwB+fi2UhgHjhKRUOXZJA81FQZmFNn9KCDApNInjDqTVLpTJZpYrKkvGx2Bz6ADyRwAVs59C4jU79QFCN4OK3HdSsxMkjhyZT89AVmg+AOW0OpAAyJd57rQaNTqBUP2YYrPKxfbb6eBIf70azbNA-CB-AGXkGdwjdqp92AEFEjktYHB0RoJRYEibVtKygFd+AkIgyAgKQGDXIYwNXARuBgxxCHggp93YLFwxrNgjwwPACBIchvE4HgoFMZwp0sX9-0AidGkgkjp2rPgDAYRgTF5RDM3I1jZ3kJRDFUdQZFkfjUDY7RdEIfRaCMdRijYLDBC5dC-Vo7D1MI5joLIlDKMsUxvD4WN4yxGCDyAA)

But this error has booleanlike type. Detail errors are preferred. The last version of the technique may evolve and use type checking via return type.

```typescript
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
```

```typescript
const isUserDetailsStrict = createDetailsStrictIs<unknown, User>()(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    && (role === 'regular user' || role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
}, identityFunc);
```

[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH2ooAHgDqdJcygA5MZwB3KAgAD2AIQgU4KA8lAD4ACjYwQQU6axVeBIA3Yi5cXliIAEpUON9-DiDZUEgOADNHOEJgVlKUcpy8gqoi4qpc-OgnP0RAsqgUiDSM8K6h0oBCFDR9Fstbe2AmlucAZRBSACNuBL4AAX0AejWAHT5gPmLLGzsHa0FMgBEIYGI6LhwPa0dLAACS0TQLjYRVYOFG41C4Ui0VhmES7XKLgASr9cERgmEIlEKmMqjIoLUIA0dsBEmwcFMZpkqPMejFPCUJrjgPjCHCcFArldgnAuAxgABaNJwYhHHiSwhIyXipVQc5UuAfOhgKUQMUSq6EDiS3CECQKSW5RBwBlQAD61gAFhBrABrKhgpQtOigABiZusUAAZFAEgkGGBcMAqD4OGDCPUkC4EeSauBqY01nTMb544nkzy+XFigLc2zCpz+lBBgUmqTxh1Jql0pkK0sVrSNm9tl6IsBfSAA4RrAdjtx9ocTlwzn2ff7A2Pp09LFSoHOBwuR84sDgXAAVDOJSPRqiHyDV88QAUAbQ3g+Ho6n3AAulRaAVWBZXltHN7N0OgbOOG1b3luQZNruUCbA49RAVCV6EsiJJmm6xoBIQx6EFGMZQFel4ZhMJ7AJYOBwSOd7-g+i7PlwL7OB+0DENEMEkWwgi8gS5HWJYpjFAkzxWKxTQAPJHAAVs4+guKh6H8lAHASa6dIVhMSQ4FSNK1tAKxoHwinicpUjBqG2lQAA-DW3TQFQ2aYMUgk-g4+jwEgPx-ACQIgtY2xoB8EDfL8-yAsC9A+RCMmEGhVTya5iAYqpkFsHQjQJIsEZwGJ4ntiGoZ8BIRBkBAUgMFZQy5fwnA8CVhBlQUDnsHiBLZqR0E9hgeAECQ5DeFV0CmM42mtSlYbpZpjQFd1OmdnwBgMIwJiChVCR9agM2CMIojiAQGiyKtulyIoyiqOoMh7dw016douiEPotBGOoxRsA1HF8l27FNbV6CdUgU29RdUDfqY3icvOgEjoJQA)

If skip a variant, Ts write details info of error.

[link to playground](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAqgzhATlAvFA3gKClArgxAOwEMBbCALijmEQEtCBzAGmykQHsAbSqAckQRGuLsWT4kfKAB9+pDgBMkxYB0RTZfYgtIM6NRCrV9MAXwDcmTAGMOhGlH2ooAHgDqdJcygA5MZwB3KAgAD2AIQgU4KA8lAD4ACjYwQQU6axVeBIA3Yi5cXliIAEpUON9-DiDZUEgOADNHOEJgVlKUcpy8gqoi4qpc-OgnP0RAsqgUiDSM8K6h0oBCFDR9Fstbe2AmlucAZRBSACNuBL4AAX0AejWAHT5gPmLLGzsHa0FMgBEIYGI6LhwPa0dLAACS0TQLjYRVYOFG41C4Ui0VhmES7XKLgASr9cERgmEIlEKmMqjIoLUIA0dsBEmwcFMZpkqPMejFPCUJrjgPjCHCcFArldgnAuAxgABaNJwYhHHiSwhIyXipVQc5UuAfOhgKUQMUSq6EDiS3CECQKSW5RBwBlQAD61gAFhBrABrKhgpQtOigABiZusUAAZFAEgkGGBcMAqD4OGDCPUkC4EeSauBqY01nTMb544nkzy+XFigLc2zCpz+lBBgUmqTxh1Jql0pkK0sVrSNm9tl6IsBfSAA4RrAdjtx9ocTlwzn2ff7A2Pp09LFSoHOBwuR84sDgXAAVDOJSPRqiHyDV88QAUAbQ3g+Ho6n3AAulRaAVWBZXltHN7N0OgbOOG1b3luQZNruUCbA49RAVCV6EsiJJmm6xoBIQx6EFGMZQFel4ZhMJ7AJYOBwSOd7-g+i7PlwL7OB+0DENEMEkWwgi8gS5HWJYpjFAkzxWKxTQAPJHAAVs4+guKh6H8lAHASa6dIVhMSQ4FSNK1tAKxoHwinicpUjBqG2lQAA-DW3TQFQ2aYMUgk-g4+jwEgPx-ACQIgtY2xoB8EDfL8-yAsC9A+RCMmEGhVTya5iAYqpkFsHQjQJIsEZwGJ4ntiGoZ8BIRBkBAUgMFZQy5fwnA8CVhBlQUDnsHiBLZqR0E9hgeAECQ5DeFV0CmM42mtSlYbpZpjQFd1OmdnwBgMIwJiChVCR9agM3yEohiqOoMiyKtun8NouiEPotBGOoxRsA1HF8l27FNbV6CdUgU29dw-W8d4nLzoBI6CUAA)

## Returning of conditional with static checking

You can't return a conditional type from a function without manual assertion by default. Manual assertions descrease safety and make meaningless accurate static contract. You can't increase safety by using a conditional return type: any changes to this type may destroy safety silently. For example, we can write such a code:

```typescript
/** Stub */
const getCharacretisticA = () => 'a' as const;
/** Stub */
const getCharacretisticB = () => 'b' as const;
/** Stub. The function should takes a long time to execute. */
const getCharacteristicC = () => 'c' as const;
type AB = { a: string, b: string };
type ABC = AB & { c: string };
```

```typescript
const getCharacteristicManual = <Mode extends 'ab' | 'abc'>(mode: Mode): Mode extends 'ab' ? AB : ABC => {
  const ab: AB = { a: getCharacretisticA(), b: getCharacretisticB() };
  return (mode === 'ab' ? ab : { ...ab, c: getCharacteristicC() }) as Mode extends 'ab' ? AB : ABC;
};
```

[link to playground](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNfBDlDq5bSa9VvaWNABZShYWCUaLmAA8-wwsT8pSqWFi0jEtnAAB9RJR4P1BDxctCiEsoTC+IT8cUSvDERiUQB+U5mJZnXqzFDgBwfTGMma3RafXQtAwddj8TbbPnNfRMP4mHqvNkGWDULC8PEwricbjIiR0zHgJbzdyGzGbe7i75VX7GUiygT2ImwilEBFIzHa+l6+mkRSvIA)

If you change type `ABC`, the factual return type of function `getCharacteristicManual` be an error, but TypeScript doesn't say about it.

[link to playground](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNc3YpaxYXPg28EOUOrltE09K12iw0ABZSjvSjRcwAHnBGFiflKVSwsWkYls4AAPqJKPB+oIeLkkUQlojkXwKWTiiU0Rj8diAPynMxLM69WYocAOAEEjkzW6LQG6FoGDrsfibbai5r6Jhgkw9X68gywahYXik5FcTjcLESVkE8BLebuC0Ezb3OXAqqg4ykFUCeyUlH0ojozEEo1s01s0iKX5AA)

If you write wrong condition in the function body, TypeScript doesn't show error too.

[link to playground](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNfBDlDq5bSa9VvaWNABZShYWCUaLmAA8-wwsT8pSqWFi0jEtnAAB9RJR4P1BDxctCiEsoTC+IT8cUSvDERiUQB+U5mJZnXqzFDgBwfTGMma3RafXQtAwddj8TbbPnNfRMP4mHqvNkGWDULC8PEwricbjI-rgOmY8BLebuI2Yzb3cXfKq-YykWUCexE2EUogIpGYiR0y5c0iKV5AA)

However, you can generate the return value of a function using the same way as generating of the function `is`.

```typescript
const getCharacteristicsCreated = <Mode extends 'ab' | 'abc'>(mode: Mode): Mode extends 'ab' ? AB : ABC => {
  const ab: AB = { a: getCharacretisticA(), b: getCharacretisticB() };
  const cond = 'ab';
  return returnConditionalType<'ab'>()(
    mode,
    mode => mode === cond ? cond : FalseResultSymbol,
    () => ab,
    () => ({ ...ab, c: getCharacteristicC() }),
  );
};
```

[link to playground](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNfBDlDq5cANYaixSbFjGKEsJRol4Jn5uAAeCjlFKxMEnUpVLCxaRBJJYDAAdywgh6Vl4KHA4EhRPAADUQbAiAAxDDUGFoJJPDZkrzUakAJVSMWg6zJNJBOCI3JwvP5eLJxIAblTafTGcy1ktKdFqXSGb4mSz+cTiWgtUqCDSgvdeLK1UQVXKNYqWZZhIqiPDweAAD4JcEYfzgQXRYWi3mQUa5eAYaK6vX0IiUKrsrk86LQJY8C3UpZOl2TB3eDkixN8qUyBix2lC-NipMptNW8AAURKaDVsSIkNV6oVhp14EzCKIghzfoDBcjfGtlttXeeSKIKOkvddAH5cwnK-glkOK7zerMi0MZIbne2IQfYSyTcFUzbO2e1nxFHrwMBgMUcNEntAALQAnCUeDRIhPywJFP3fYDwAAAWOVJ6EYcYv1SMDoGATQjFnL9oM-KRhWoIEcCLL4fl4HgDVhI85XAABCThuE3QMk2DUNwz4ItiWXaNS3jLckxIw9YmPFjH2JZ9XyQ79mD-ACgJAsC-Cg8EcFg+DP0Qj8UMcNCsAw8EsJwHC8NY8Alg4qo6ILK8JxvbVnnsBsm1gFs22vTVbw2Hs+L7AciwEexj0nVzihKZFUXcsisz8ZcuPo9dfXLaKHxeFB73eLQzLXRiw2icwMvDHgRDSoMQ0ykRkv3AA5IhpTaHKsu4Gq8oqqrqBqkrFBShodGaOgqnaFg0BwUgSyqeIoQAWQwFtAuC6QxFsd1RD-fo8VyCba3Glsx3Ada-BnOcFrm5dLiWM4dzJfc-2OmZbkWbQmj0aNDD6th+E2bZbt0FoDA6UwelefV6gcFFzFmkQEsIrBPhIb5fn+QFGGwEE+0haDvUB2I8T4HgixWltI2JHGIWEAmuBotHwHY-4jNi-1uOgGq8YsXo-wZ-FhB4eZ3E55mZCWRoPu6tpvtIX6+FHRRXiAA)

In this case, if any error exists, TypeScript shows it.

links to playground:

- [new field in ABC](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNc3YpaxYXPg28EOUOrlwAZYNQsKRsLFGKEsJRol4Jn5uAAeCjlFKxOEnUpVLCxaRBJJYDAAdywgh6Vl4KHA4ERVPAADUYbAiAAxDDUFFoJJPDZ0rzUZkAJVSMWg6zpLJhOCIwpwovFZLp1IAbkzWezOdy1ktGdFmWyOb4uTzxdTqWgjVqCCygvdeKq9UQdWqDZqeZZhJqiOj4eAAD4JeEYfzgSXRaWy0WQUafDDRU1m+hEShVflCkXRaBLHgO5lLL0+yYe7wCmUZsVKmQMFOsqVluWZ7O5p3gACiJTQetiRERuv1GstJvABYxREExbDEfLCb4zsdrsHa2KJWxuOHlu9o-AAH4S+mG-glpP66LerNK0MZBvYn2EVfUTybcEcy6Bw+1nxFGbwMBgMUcNETzQAAtBCOCUPA0REMBWBYsBgGweAAACxypPQjDjCBqQIdAwCaEYRBYCBqHAVI0rUFCOCVkCIK8DwFqot6t7gAAhJw3DHpGmbRrG0R8JW1K7kmNZpiemb0det78d+1K-v+OGgcwEFQTBcEIX4KHwjg6GYcB2FAXhjgEURwEkWRbSUQJ4BLMJVSceWL7zm+xpLvY7adrA3a9q+hrvhs66MYWY7SWaAj2LeC5+cuq7SCOvq7qJXGHqGdZJV+PwoJ+-xaPZB48fAcbmPlcY8CIuVRjGBXRCIWWXgAckQyptMV0RFZVJUiA1TXUC1NWKNlDQ6M0dBVO0LBoDgpDVlU8RIgAshg3bRYRa5iLY-qiBB-Rkrki0tgt3azuAB1+FiK3SGtEi7pcSxnGedKXhBt0zLcizaE0ehJoY41sPwmzbO9ugtAYHSmD0vzmvUDg4uYl3pTRWCAiQwKguCkKMNgMKjoiqHBtDsRknwPCVrt3YJtSpMIsIlNcOx+M7vTR6peWLXkxYvQQWz5LCDw8zuPznMyEsjRAyNbSg6Q4N8DOii-EAA)
- [inverted condition](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNfBDlDq5cANYaixSbFjGKEsJRol4Jn5uAAeCjlFKxMEnUpVLCxaRBJJYDAAdywgh6Vl4KHA4EhRPAADUQbAiAAxDDUGFoJJPDZkrzUakAJVSMWg6zJNJBOCI3JwvP5eLJxIAblTafTGcy1ktKdFqXSGb4mSz+cTiWgtUqCDSgvdeLK1UQVXKNYqWZZhIqiPDweAAD4JcEYfzgQXRYWi3mQUa5eAYaK6vX0IiUKrsrk86LQJY8C3UpZOl2TB3eDkixN8qUyBix2lC-NipMptNW8AAURKaDVsSIkNV6oVhp14EzCKIghzfoDBcjfGtlttXeeSKIKOkvddAH5cwnK-glkOK7zerMi0MZIbne2IQfYSyTcFUzbO2e1nxFHrwMBgMUcNEntAALQAnCUeDRIhPywJFP3fYDwAAAWOVJ6EYcYv1SMDoGATQjFnL9oM-KRhWoIEcCLL4fl4HgDVhI85XAABCThuE3QMk2DUNwz4ItiWXaNS3jLckxIw9YmPFjH2JZ9XyQ79mD-ACgJAsC-Cg8EcFg+DP0Qj8UMcNCsAw8EsJwHC8NY8Alg4qo6ILK8JxvbVnnsBsm1gFs22vTVbw2Hs+L7AciwEexj0nVzihKZFUXcsisz8ZcuPo9dfXLaKHxeFB73eLQzLXRiw2icwMvDHgRDSoMQ0ykRkv3AA5IhpTaHKsu4Gq8oqqrqBqkrFBShodGaOgqnaFg0BwUgSyqeIoQAWQwFtAuC6QxFsd1RD-fo8VyCba3Glsx3Ada-BnOcFrm5dLiWM4dzJfc-2OmZbkWbQmj0aNDD6th+E2bZbt0FoDA6UwelefV6gcFFzFm-oEsIrBPhIb5fn+QFGGwEE+0haDvUB2I8T4HgixWltI2JHGIWEAmuBotHwHY-4jNi-1uOgGq8YsXo-wZ-FhB4eZ3E55mZCWRoPu6tpvtIX6+FHRRXiAA)
- [typo by manual typing of condition](https://www.typescriptlang.org/play/?#code/PQKhAIGUBcFcCNwmAKAMYHsB2Bna4BzAU2gGEALAQwCdK1qSBLPRtAQXAF5wAKASi4A+cAHJKI8JRzhMuaAG4UoCDARJUsvIRIUadBtGaG0AIS68BnYSPgSpM7HkXKoceADpwAFXJFwAM1gsNENscBxyDFgAGwATcGhKAGsiaUpwaOwCBMYAWz9oDHAiAA8iNFhoIk9kdEd8YjIqWhCiaiNWUnN+IVE0O2lNBRRoAE8ABz82M24Ab0kALnDodqwCABpweCW8VeyAX0UxyfBpru5p8AAycHm0HZXGNfBDlDq5cANYaixSbFjGKEsJRol4Jn5uAAeCjlFKxMEnUpVLCxaRBJJYDAAdywgh6Vl4KHA4EhRPAADUQbAiAAxDDUGFoJJPDZkrzUakAJVSMWg6zJNJBOCI3JwvP5eLJxIAblTafTGcy1ktKdFqXSGb4mSz+cTiWgtUqCDSgvdeLK1UQVXKNYqWZZhIqiPDweAAD4JcEYfzgQXRYWi3mQUa5eAYaK6vX0IiUKrsrk86LQJY8C3UpZOl2TB3eDkixN8qUyBix2lC-NipMptNW8AAURKaDVsSIkNV6oVhp14EzCKIghzfoDBcjfGtlttXeeSKIKOkvddAH5cwnK-glkOK7zerMi0MZIbne2IQfYSyTcFUzbO2e1nxFHrwMBgMUcNEntAALQAnCUeDRIhPywJFP3fYDwAAAWOVJ6EYcYv1SMDoGATQjFnL9oM-KRhWoIEcCLL4fl4HgDVhI85XAABCThuE3QMk2DUNwz4ItiWXaNS3jLckxIw9YmPFjH2JZ9XyQ79mD-ACgJAsC-Cg8EcFg+DP0Qj8UMcNCsAw8EsJwHC8NY8Alg4qo6ILK8JxvbVnnsBsm1gFs22vTVbw2Hs+L7AciwEexj0nVzihKZFUXcsisz8ZcuPo9dfXLaKHxeFB73eLQzLXRiw2icwMvDHgRDSoMQ0ykRkv3AA5IhpTaHKsu4Gq8oqqrqBqkrFBShodGaOgqnaFg0BwUgSyqeIoQAWQwFtAuC6QxFsd1RD-fo8VyCba3Glsx3Ada-BnOcFrm5dLiWM4dzJfc-2OmZbkWbQmj0aNDD6th+E2bZbt0FoDA6UwelefV6gcFFzFm-oEsIrBPhIb5fn+QFGGwEE+0hWaRDxPgeCLFaW0jYksYhYQ8a4GjAfidj-iM2L-W46Aapxixej-On8WEHh5ncdnGZkJZGg+7q2m+0hfr4UdFFeIA)
