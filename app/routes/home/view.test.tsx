import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import Home from './view';

test('matches snapshot', async () => {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: Home,
    },
  ]);

  const { container } = render(<Stub />);

  expect(container).toMatchSnapshot();
});
