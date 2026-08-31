import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { FormFieldStyle } from './form-field-style';

describe('FormFieldStyle', () => {
  test('renders the component with base style', () => {
    const { container } = render(
      <FormFieldStyle as="input" type="email" />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders error state', () => {
    const { container } = render(
      <FormFieldStyle as="input" type="email" aria-invalid={true} />,
    );

    expect(container).toMatchSnapshot();
  });

  test('does not transition transform or opacity', () => {
    const { container } = render(
      <FormFieldStyle as="input" type="email" />,
    );
    const classes = container.firstElementChild?.className ?? '';

    expect(classes).not.toMatch(/(^|\s)transition-all(\s|$)/);
    expect(classes).toContain(
      'transition-[color,background-color,border-color,box-shadow]',
    );
  });
});
