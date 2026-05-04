import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './logo';

describe('Logo', () => {
  it('renders svg logo', () => {
    const { container } = render(<Logo />);

    expect(container).toMatchSnapshot();
  });
});
