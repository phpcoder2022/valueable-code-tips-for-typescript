import { tricklyUseVariablesThenCompilatorWontScold } from '../../../src/ts/tricks';
import { isObj } from '../../../src/ts/type-guards';
import { createDetailsStrictIs, createStrictIs, identityFunc, is, isnt } from '../../../src/ts/tips/is-funcs';

type User = {
  username: string,
  role: 'regular user' | 'moderator' | 'administrator'
};

const isUser = is<unknown, User>(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    && (role === 'regular user' || role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
});

const isUserStrict = createStrictIs<unknown, User>()(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    && (role === 'regular user' || role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
}, 'complete');

const isUserDetailsStrict = createDetailsStrictIs<unknown, User>()(value => {
  if (!(isObj(value) && 'username' in value && 'role' in value)) return isnt;
  const { username, role } = value;
  if (!(typeof username === 'string'
    && (role === 'regular user' || role === 'moderator' || role === 'administrator')
  )) return isnt;
  return { username, role };
}, identityFunc);

tricklyUseVariablesThenCompilatorWontScold(isUser, isUserStrict, isUserDetailsStrict);

test('congruence between compile-time & run-time checks', () => {
  const users: User[] = [
    { username: 'Steven', role: 'regular user' },
    { username: 'Ramsey', role: 'moderator' },
    { username: 'Admin', role: 'administrator' },
  ];
  users.forEach(user => { expect(isUser(user)).toBe(true); });
});
