# Code tips

## Summary

1. [Static checking type guards](#static-checking-type-guards)

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
