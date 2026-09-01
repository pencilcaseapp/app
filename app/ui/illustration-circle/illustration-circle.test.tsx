import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IllustrationCircle } from './illustration-circle';

describe('IllustrationCircle', () => {
  it('renders the illustration as decoration', () => {
    const { container } = render(
      <IllustrationCircle src="/upgrade-pencil@2x.png" />,
    );

    const image = screen.getByRole('presentation');

    expect(image).toHaveAttribute('src', '/upgrade-pencil@2x.png');
    expect(image).toHaveAttribute('width', '142');
    expect(container).toMatchSnapshot();
  });

  it('describes the illustration when asked to', () => {
    render(
      <IllustrationCircle src="/upgrade-pencil@2x.png" alt="A pencil" />,
    );

    expect(screen.getByRole('img', { name: 'A pencil' })).toBeInTheDocument();
  });
});
