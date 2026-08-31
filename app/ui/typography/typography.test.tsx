import { expect, it, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Typography } from './typography';

describe('Typography', () => {
  it('renders children text', () => {
    render(<Typography>Hello World</Typography>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  describe('variant to HTML element mapping', () => {
    it('renders title as h1', () => {
      render(<Typography variant="title">Title</Typography>);
      expect(screen.getByText('Title').tagName).toBe('H1');
    });

    it('renders heading1 as h1', () => {
      render(<Typography variant="heading1">Heading 1</Typography>);
      expect(screen.getByText('Heading 1').tagName).toBe('H1');
    });

    it('renders heading2 as h2', () => {
      render(<Typography variant="heading2">Heading 2</Typography>);
      expect(screen.getByText('Heading 2').tagName).toBe('H2');
    });

    it('renders heading3 as h3', () => {
      render(<Typography variant="heading3">Heading 3</Typography>);
      expect(screen.getByText('Heading 3').tagName).toBe('H3');
    });

    it('renders body as p', () => {
      render(<Typography variant="body">Body</Typography>);
      expect(screen.getByText('Body').tagName).toBe('P');
    });

    it('renders bodySmall as p', () => {
      render(<Typography variant="bodySmall">Body Small</Typography>);
      expect(screen.getByText('Body Small').tagName).toBe('P');
    });

    it('renders bodyTiny as p', () => {
      render(<Typography variant="bodyTiny">Body Tiny</Typography>);
      expect(screen.getByText('Body Tiny').tagName).toBe('P');
    });

    it('defaults to body (p) when no variant is provided', () => {
      render(<Typography>Default</Typography>);
      expect(screen.getByText('Default').tagName).toBe('P');
    });
  });

  describe('polymorphic "as" prop', () => {
    it('renders as a span when as="span"', () => {
      render(
        <Typography as="span" variant="body">
          Span Text
        </Typography>,
      );
      expect(screen.getByText('Span Text').tagName).toBe('SPAN');
    });

    it('renders as a label when as="label"', () => {
      render(
        <Typography as="label" variant="body" htmlFor="test">
          Label Text
        </Typography>,
      );
      const el = screen.getByText('Label Text');
      expect(el.tagName).toBe('LABEL');
      expect(el).toHaveAttribute('for', 'test');
    });

    it('overrides default variant element', () => {
      render(
        <Typography as="h3" variant="title">
          Title as H3
        </Typography>,
      );
      expect(screen.getByText('Title as H3').tagName).toBe('H3');
    });
  });

  describe('variant classes', () => {
    it('title applies text-5xl and font-bold', () => {
      render(<Typography variant="title">Title</Typography>);
      const el = screen.getByText('Title');
      expect(el.className).toContain('text-5xl');
      expect(el.className).toContain('font-bold');
    });

    it('heading1 applies text-[28px] and font-bold', () => {
      render(<Typography variant="heading1">H1</Typography>);
      const el = screen.getByText('H1');
      expect(el.className).toContain('text-[28px]');
      expect(el.className).toContain('font-bold');
    });

    it('heading2 applies text-xl and font-bold', () => {
      render(<Typography variant="heading2">H2</Typography>);
      const el = screen.getByText('H2');
      expect(el.className).toContain('text-xl');
      expect(el.className).toContain('font-bold');
    });

    it('heading3 applies text-base and font-semibold', () => {
      render(<Typography variant="heading3">H3</Typography>);
      const el = screen.getByText('H3');
      expect(el.className).toContain('text-base');
      expect(el.className).toContain('font-semibold');
    });

    it('body applies text-base and font-normal', () => {
      render(<Typography variant="body">Body</Typography>);
      const el = screen.getByText('Body');
      expect(el.className).toContain('text-base');
      expect(el.className).toContain('font-normal');
    });

    it('bodySmall applies text-sm and font-normal', () => {
      render(<Typography variant="bodySmall">Small</Typography>);
      const el = screen.getByText('Small');
      expect(el.className).toContain('text-sm');
      expect(el.className).toContain('font-normal');
    });

    it('bodyTiny applies text-xs and font-normal', () => {
      render(<Typography variant="bodyTiny">Tiny</Typography>);
      const el = screen.getByText('Tiny');
      expect(el.className).toContain('text-xs');
      expect(el.className).toContain('font-normal');
    });
  });

  describe('text color', () => {
    it('applies default light color grey-900', () => {
      render(<Typography>Default Color</Typography>);
      const el = screen.getByText('Default Color');
      expect(el.className).toContain('text-pca-grey-900');
    });

    it('applies custom textColorLight', () => {
      render(
        <Typography textColorLight="blue-500">Blue Text</Typography>,
      );
      expect(screen.getByText('Blue Text').className).toContain(
        'text-pca-blue-500',
      );
    });

    it('applies custom textColorDark', () => {
      render(
        <Typography textColorDark="red-500">Red Dark</Typography>,
      );
      expect(screen.getByText('Red Dark').className).toContain(
        'dark:text-pca-red-500',
      );
    });

    it('applies default dark color white', () => {
      render(<Typography>White Dark</Typography>);
      expect(screen.getByText('White Dark').className).toContain(
        'dark:text-white',
      );
    });
  });

  describe('textAlign', () => {
    it('applies text-center', () => {
      render(<Typography textAlign="center">Center</Typography>);
      expect(screen.getByText('Center').className).toContain('text-center');
    });

    it('applies text-right', () => {
      render(<Typography textAlign="right">Right</Typography>);
      expect(screen.getByText('Right').className).toContain('text-right');
    });

    it('applies text-left', () => {
      render(<Typography textAlign="left">Left</Typography>);
      expect(screen.getByText('Left').className).toContain('text-left');
    });
  });

  describe('fontWeight', () => {
    it('applies font-normal for regular', () => {
      render(
        <Typography fontWeight="regular" variant="title">
          Regular
        </Typography>,
      );
      const el = screen.getByText('Regular');
      expect(el.className).toContain('font-normal');
      expect(el.className).not.toContain('font-bold');
    });

    it('applies font-semibold', () => {
      render(<Typography fontWeight="semibold">Semi</Typography>);
      expect(screen.getByText('Semi').className).toContain('font-semibold');
    });

    it('applies font-bold', () => {
      render(<Typography fontWeight="bold">Bold</Typography>);
      expect(screen.getByText('Bold').className).toContain('font-bold');
    });
  });

  describe('textTransform', () => {
    it('applies uppercase', () => {
      render(<Typography textTransform="uppercase">Upper</Typography>);
      expect(screen.getByText('Upper').className).toContain('uppercase');
    });

    it('applies capitalize', () => {
      render(<Typography textTransform="capitalize">Cap</Typography>);
      expect(screen.getByText('Cap').className).toContain('capitalize');
    });

    it('applies lowercase', () => {
      render(<Typography textTransform="lowercase">Lower</Typography>);
      expect(screen.getByText('Lower').className).toContain('lowercase');
    });
  });

  describe('className', () => {
    it('merges custom className', () => {
      render(<Typography className="mb-4">Custom</Typography>);
      const el = screen.getByText('Custom');
      expect(el.className).toContain('mb-4');
      expect(el.className).toContain('antialiased');
    });
  });

  it('always applies antialiased and font-inter', () => {
    render(<Typography>Base</Typography>);
    const el = screen.getByText('Base');
    expect(el.className).toContain('antialiased');
    expect(el.className).toContain('font-inter');
  });

  describe('snapshots', () => {
    it('title variant matches snapshot', () => {
      const { container } = render(
        <Typography variant="title">Title Snapshot</Typography>,
      );
      expect(container).toMatchSnapshot();
    });

    it('heading1 variant matches snapshot', () => {
      const { container } = render(
        <Typography variant="heading1">Heading 1 Snapshot</Typography>,
      );
      expect(container).toMatchSnapshot();
    });

    it('body variant with defaults matches snapshot', () => {
      const { container } = render(
        <Typography>Body Default Snapshot</Typography>,
      );
      expect(container).toMatchSnapshot();
    });

    it('bodySmall variant matches snapshot', () => {
      const { container } = render(
        <Typography variant="bodySmall">Body Small Snapshot</Typography>,
      );
      expect(container).toMatchSnapshot();
    });

    it('fully customized typography matches snapshot', () => {
      const { container } = render(
        <Typography
          variant="heading2"
          textColorLight="blue-500"
          textColorDark="grey-100"
          textAlign="center"
          fontWeight="semibold"
          textTransform="uppercase"
          className="mb-8"
        >
          Fully Customized
        </Typography>,
      );
      expect(container).toMatchSnapshot();
    });

    it('polymorphic as label matches snapshot', () => {
      const { container } = render(
        <Typography
          as="label"
          variant="body"
          textColorLight="grey-600"
          fontWeight="semibold"
          htmlFor="email"
        >
          Email Label
        </Typography>,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
