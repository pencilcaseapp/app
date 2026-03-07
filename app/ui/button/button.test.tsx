import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, type ButtonColor } from './button';

describe('Button', () => {
  test('renders children and defaults to <button>', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('sets the disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('applies pointer-events-none and keeps text when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button').className).toMatch(/pointer-events-none/);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  test('appends custom className', () => {
    render(<Button className="my-custom-class">Styled</Button>);
    expect(screen.getByRole('button').className).toMatch(/my-custom-class/);
  });

  test('forwards ref to the underlying element', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  test('renders as an anchor when as="a"', () => {
    const { container } = render(
      <Button as="a" href="https://example.com">Link</Button>,
    );
    const anchor = container.querySelector('a');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', 'https://example.com');
  });

  describe('colors', () => {
    test.each<[ButtonColor, string]>([
      ['primary', 'bg-pca-grey-900'],
      ['secondary', 'bg-pca-white'],
      ['upgrade', 'bg-pca-yellow-500'],
      ['danger', 'bg-pca-red-500'],
    ])('renders %s color with expected class', (color, expectedClass) => {
      const { container } = render(<Button color={color}>{color}</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(expectedClass);
      expect(container).toMatchSnapshot();
    });
  });

  describe('icon', () => {
    test('renders an icon when icon prop is provided', () => {
      const { container } = render(<Button icon="share">Share</Button>);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('renders icon-only button with square sizing when no children', () => {
      render(<Button icon="h1" title="Heading 1" />);
      const button = screen.getByRole('button');
      const iconTitle = screen.getByTitle('Heading 1');

      expect(iconTitle).toBeInTheDocument();
      expect(button.className).toMatch(/w-9/);
      expect(button.className).toMatch(/h-9/);
    });
  });

  describe('iconPosition', () => {
    test.each<['start' | 'end', RegExp]>([
      ['end', /flex-row(?!-reverse)/],
      ['start', /flex-row-reverse/],
    ])('applies correct layout for iconPosition="%s"', (position, pattern) => {
      render(<Button icon="share" iconPosition={position}>Share</Button>);
      expect(screen.getByRole('button').className).toMatch(pattern);
    });
  });
});
