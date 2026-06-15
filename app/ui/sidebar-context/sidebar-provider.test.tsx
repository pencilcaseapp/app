import { act, render, renderHook, waitFor } from '@testing-library/react';
import { SidebarProvider } from './sidebar-provider';
import { use } from 'react';
import { SidebarContext } from './sidebar-context';
import { describe, expect, it } from 'vitest';

describe('SidebarProvider', () => {
  it('should render children', () => {
    const { getByText, container } = render(
      <SidebarProvider>child</SidebarProvider>,
    );

    expect(getByText('child')).toBeInTheDocument();
    expect(container).toMatchInlineSnapshot(`
      <div>
        child
      </div>
    `);
  });

  it('should provide isSidebarOpen and setIsSidebarOpen', () => {
    const { result } = renderHook(() => use(SidebarContext), {
      wrapper: SidebarProvider,
    });

    expect(result.current?.isSidebarOpen).toBe(false);
    expect(result.current?.setIsSidebarOpen).toBeInstanceOf(Function);
  });

  it('should set isSidebarOpen', async () => {
    const { result } = renderHook(() => use(SidebarContext), {
      wrapper: SidebarProvider,
    });

    act(() => {
      result.current?.setIsSidebarOpen(true);
    });
    await waitFor(() => {
      expect(result.current?.isSidebarOpen).toBe(true);
    });
  });
});
