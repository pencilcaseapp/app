import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Toggle } from './toggle';

describe('not active', () => {
  test('matches snapshot', async () => {
    const { container } = render(<Toggle isActive={false}>Toggle</Toggle>);

    expect(container).toMatchSnapshot();
  });
});

describe('active', () => {
  test('matches snapshot', async () => {
    const { container } = render(<Toggle isActive>Toggle</Toggle>);

    expect(container).toMatchSnapshot();
  });
});
