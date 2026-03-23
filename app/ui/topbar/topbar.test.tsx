import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Topbar } from './topbar';

vi.mock('react-use', () => ({
  useWindowScroll: () => 0,
  useScroll: () => 0,
}));

describe('Topbar', () => {
  test('renders left, center, and right sections', () => {
    render(
      <Topbar
        left={<button>Menu</button>}
        center={<span>Toolbar</span>}
        right={<button>Share</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByText('Toolbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  test('applies border class when hasBorder is true', () => {
    const { container } = render(<Topbar hasBorder />);
    expect(container.querySelector('header')?.className).toMatch(/border-b/);
  });

  test('does not apply border class when hasBorder is false', () => {
    const { container } = render(<Topbar hasBorder={false} />);
    expect(container.querySelector('header')?.className).not.toMatch(/border-b/);
  });

  test('matches snapshot', () => {
    const { container } = render(
      <Topbar
        left={<button>Menu</button>}
        center={<span>Toolbar</span>}
        right={<button>Share</button>}
        hasBorder
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
