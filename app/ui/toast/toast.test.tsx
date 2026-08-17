import { Toast as BaseToast } from '@base-ui/react/toast';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toast } from './toast';

const renderToast = (type?: string) =>
  render(
    <BaseToast.Provider>
      <Toast toast={{ id: 'toast-id', type, title: 'Something happened' }} />
    </BaseToast.Provider>,
  );

describe('Toast', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      const { getByText } = renderToast();

      expect(getByText('Something happened')).toBeInTheDocument();
    });

    it('labels the toast with its title', () => {
      const { getByRole, getByText } = renderToast();

      expect(getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        getByText('Something happened').id,
      );
    });
  });

  const variants = [
    { variant: 'info', bg: 'bg-pca-blue-300', border: 'border-pca-blue-900' },
    { variant: 'success', bg: 'bg-pca-green-300', border: 'border-pca-green-900' },
    { variant: 'warning', bg: 'bg-pca-orange-300', border: 'border-pca-orange-900' },
    { variant: 'danger', bg: 'bg-pca-red-300', border: 'border-pca-red-900' },
  ] as const;

  it.each(variants)('variant $variant — applies correct background and border classes', ({ variant, bg, border }) => {
    const { getByRole } = renderToast(variant);

    expect(getByRole('dialog')).toHaveClass(bg, border);
  });

  it('falls back to the info variant for an unknown type', () => {
    const { getByRole } = renderToast('whatever');

    expect(getByRole('dialog')).toHaveClass('bg-pca-blue-300');
  });

  it.each(variants)('variant $variant — matches snapshot', ({ variant }) => {
    const { getByRole } = renderToast(variant);

    expect(getByRole('dialog')).toMatchSnapshot();
  });
});
