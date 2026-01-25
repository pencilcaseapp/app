import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './button';

test('matches snapshot', async () => {
  const { container } = render(<Button>Hello Button</Button>);

  expect(container).toMatchSnapshot();
});
