import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <Label
        htmlFor="test"
      >
        This is a label
      </Label>,
    );

    expect(container).toMatchSnapshot();
  });

  test('disabled matches snapshot', () => {
    const { container } = render(
      <Label
        htmlFor="test"
        disabled
      >
        This is a label
      </Label>,
    );

    expect(container).toMatchSnapshot();
  });
});
