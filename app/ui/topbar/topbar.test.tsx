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

  test('renders the scroll fade below the bar', () => {
    const { container } = render(<Topbar />);
    const fade = container.querySelector('[aria-hidden]');
    expect(fade?.className).toMatch(/bg-linear-to-b/);
  });

  test('renders a solid bar instead of the fade when hasSolidBackground is set', () => {
    const { container } = render(<Topbar hasSolidBackground />);
    expect(container.querySelector('[aria-hidden]')).toBeNull();
    expect(container.querySelector('header')?.className).toMatch(/border-b/);
  });

  test('matches snapshot', () => {
    const { container } = render(
      <Topbar
        left={<button>Menu</button>}
        center={<span>Toolbar</span>}
        right={<button>Share</button>}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
