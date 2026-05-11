import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import LayoutAuth from './auth';
import { createRoutesStub } from 'react-router';

describe('LayoutAuth', () => {
  test('matches snapshot', () => {
    const Stub = createRoutesStub([{
      path: '/',
      Component: LayoutAuth,
      children: [
        {
          path: '/',
          Component: () => 'Content',
        },
      ],
    },
    ]);

    const { container } = render(
      <Stub />,
    );

    expect(container).toMatchSnapshot();
  });
});
