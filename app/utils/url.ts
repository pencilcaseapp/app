export function withSearchParams(
  path: string,
  searchParams: Record<string, string>,
): string {
  const searchParamsString = new URLSearchParams(searchParams).toString();
  return `${path}?${searchParamsString}`;
}
