import { render } from '@testing-library/react';
import { createRoutesStub, type Register } from 'react-router';
import routes from '~/routes';

export async function renderRoute(path: keyof Register['pages']) {
  const flatRoutes = routes.map(r => [r, ...(r.children ?? [])]).flat();
  const route = flatRoutes.find(r => `/${r.path}` === path);
  const file = await import(`~/${route?.file}`);

  const Stub = createRoutesStub([
    {
      path: '/',
      Component: file.default,
      ...file,
    },
  ]);

  return render(<Stub />);
}
