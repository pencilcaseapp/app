import { act, render } from '@testing-library/react';
import { createRoutesStub, type Register } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import routes from '~/routes';

export async function renderRoute(path: keyof Register['pages']) {
  const flatRoutes = routes.map(r => [r, ...(r.children ?? [])]).flat();
  const route = flatRoutes.find(r => `/${r.path}` === path);
  const file = await import(`~/${route?.file}`);
  const Component = file.default;

  const Stub = createRoutesStub([
    {
      ...file,
      path: '/',
      Component,
      HydrateFallback: () => null,
    },
  ]);

  const result = render(
    <AuthenticityTokenProvider token="test-token">
      <Stub />
    </AuthenticityTokenProvider>,
  );

  await act(async () => {});

  return result;
}
