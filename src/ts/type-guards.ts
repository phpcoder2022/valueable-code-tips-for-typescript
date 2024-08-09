import { is, isnt } from './tips/is-funcs';

export const isObj = is<unknown, object>(value => (
  typeof value === 'object' && value ? value : isnt
));
