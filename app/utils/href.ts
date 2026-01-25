import { href } from 'react-router';

type Args = Parameters<typeof href>;

export function hrefWithTrailingSlash<Path extends Args[0]>(
  path: Path,
  ...args: Path extends Args[0] ? Args extends [Args[0], ...infer Rest] ? Rest : never : never
) {
  return `${href(path, ...args)}/`;
}
