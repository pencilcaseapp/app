import { act, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SearchParamToast } from '~/constants/search-params';
import { ToastProvider } from '~/ui/toast/toast';
import { useToast } from './use-toast';

const renderUseToast = async (searchParams: Record<string, string>) => {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => {
        useToast();
        return null;
      },
    },
  ]);
  const query = new URLSearchParams(searchParams).toString();

  const result = render(
    <ToastProvider>
      <Stub initialEntries={[`/?${query}`]} />
    </ToastProvider>,
  );

  await act(async () => {});

  return result;
};

describe('useToast', () => {
  it('should not emit a toast without a toast search param', async () => {
    await renderUseToast({});

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  const variants = [
    { param: SearchParamToast.ToastSuccess, bg: 'bg-pca-green-300' },
    { param: SearchParamToast.ToastInfo, bg: 'bg-pca-blue-300' },
    { param: SearchParamToast.ToastDanger, bg: 'bg-pca-red-300' },
  ] as const;

  it.each(variants)('should emit a toast for $param', async ({ param, bg }) => {
    await renderUseToast({ [param]: 'Something happened' });

    expect(screen.getByText('Something happened')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass(bg);
  });

  it('should decode the message', async () => {
    await renderUseToast({
      [SearchParamToast.ToastInfo]: encodeURIComponent('Hello — world'),
    });

    expect(screen.getByText('Hello — world')).toBeInTheDocument();
  });

  it('should emit one toast per search param', async () => {
    await renderUseToast({
      [SearchParamToast.ToastSuccess]: 'Saved',
      [SearchParamToast.ToastDanger]: 'But something failed',
    });

    expect(screen.getAllByRole('dialog')).toHaveLength(2);
  });
});
