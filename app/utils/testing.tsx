import { act, render } from '@testing-library/react';
import { createRoutesStub, RouterContextProvider, type Register } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import routes from '~/routes';

export async function renderRoute<P extends keyof Register['pages']>(
  path: P,
  options?: Register['pages'][P] & { searchParams?: Record<string, string>; context?: RouterContextProvider },
) {
  const flatRoutes = routes.map(r => [r, ...(r.children ?? [])]).flat();
  const route = flatRoutes.find(r => `/${r.path}` === path);
  const file = await import(`~/${route?.file}`);
  const Component = file.default;

  let replacedPath: string = path;
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      replacedPath = replacedPath.replace(`:${key}`, value);
    }
  }

  const Stub = createRoutesStub([
    {
      ...file,
      path: replacedPath,
      Component,
      middleware: [],
      HydrateFallback: () => null,
      ErrorBoundary: () => null,
    },
  ], options?.context);

  if (options?.searchParams) {
    const searchParams = new URLSearchParams(options.searchParams).toString();
    replacedPath = `${replacedPath}?${searchParams}`;
  }

  const result = render(
    <AuthenticityTokenProvider token="test-token">
      <Stub initialEntries={[replacedPath]} />
    </AuthenticityTokenProvider>,
  );

  await act(async () => {});

  return result;
}
