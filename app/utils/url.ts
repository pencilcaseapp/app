import { data, href } from 'react-router';

export function withSearchParams(
  path: string,
  searchParams: Record<string, string>,
): string {
  const searchParamsString = new URLSearchParams(searchParams).toString();
  return `${path}?${searchParamsString}`;
}

/** Adds search params to a path that may have some already. */
export function addSearchParams(
  path: string,
  searchParams: Record<string, string>,
): string {
  const url = new URL(path, 'http://localhost');

  for (const [name, value] of Object.entries(searchParams)) {
    url.searchParams.set(name, value);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function getRequiredSearchParam<Param = string>(
  request: Request,
  name: string,
): Param {
  const url = new URL(request.url);
  const searchParam = url.searchParams.get(name);

  if (!searchParam) {
    throw data(`Missing search param ${name}`, {
      status: 400,
    });
  }

  return searchParam as Param;
}

export function getOptionalSearchParam<Param = string>(
  request: Request,
  name: string,
): Param | undefined {
  const url = new URL(request.url);
  const searchParam = url.searchParams.get(name);

  return searchParam ? (searchParam as Param) : undefined;
}

export function getNormalizedReturnUrl(returnUrl?: string | null): string {
  if (!returnUrl?.startsWith('/')) {
    return href('/');
  }

  // Browsers read `/\evil.com` and `/\t/evil.com` as another host, like
  // `//evil.com`, so only a path that stays on our origin is kept.
  const base = 'http://localhost';
  const url = new URL(returnUrl, base);

  return url.origin === base
    ? `${url.pathname}${url.search}${url.hash}`
    : href('/');
}
