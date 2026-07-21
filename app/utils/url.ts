import { data, href } from 'react-router';

export function withSearchParams(
  path: string,
  searchParams: Record<string, string>,
): string {
  const searchParamsString = new URLSearchParams(searchParams).toString();
  return `${path}?${searchParamsString}`;
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
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return href('/home');
  }

  return returnUrl;
}
