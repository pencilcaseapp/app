import { act, render, renderHook, waitFor } from '@testing-library/react';
import { SidebarProvider } from './sidebar-provider';
import { use } from 'react';
import { SidebarContext } from './sidebar-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useMediaMock = vi.fn();

vi.mock('react-use', async () => {
  const actual = await vi.importActual('react-use');
  return {
    ...actual,
    useMedia: () => useMediaMock(),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SidebarProvider', () => {
  describe('rendering and context provision', () => {
    it('should render children', () => {
      useMediaMock.mockReturnValue(false);

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

    it('should provide isSidebarOpen, setIsSidebarOpen, and triggerRef', () => {
      useMediaMock.mockReturnValue(false);

      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      expect(result.current?.isSidebarOpen).toBe(false);
      expect(result.current?.setIsSidebarOpen).toBeInstanceOf(Function);
      expect(result.current?.triggerRef).toBeDefined();
    });
  });

  describe('mobile viewport behavior', () => {
    beforeEach(() => {
      useMediaMock.mockReturnValue(false); // mobile
    });

    it('should start with sidebar closed on mobile', () => {
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      expect(result.current?.isSidebarOpen).toBe(false);
    });

    it('should allow setting sidebar open on mobile', async () => {
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

    it('should keep mobile state ephemeral (not persist)', async () => {
      const onDesktopOpenChange = vi.fn();
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: ({ children }) => (
          <SidebarProvider onDesktopOpenChange={onDesktopOpenChange}>
            {children}
          </SidebarProvider>
        ),
      });

      act(() => {
        result.current?.setIsSidebarOpen(true);
      });

      await waitFor(() => {
        expect(result.current?.isSidebarOpen).toBe(true);
      });

      expect(onDesktopOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('desktop viewport behavior', () => {
    beforeEach(() => {
      useMediaMock.mockReturnValue(true); // desktop
    });

    it('should start open by default', () => {
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      expect(result.current?.isSidebarOpen).toBe(true);
    });

    it('should start the way the server says', () => {
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: ({ children }) => (
          <SidebarProvider defaultDesktopOpen={false}>
            {children}
          </SidebarProvider>
        ),
      });

      expect(result.current?.isSidebarOpen).toBe(false);
      expect(result.current?.isDesktopSidebarOpen).toBe(false);
    });

    it('should hand desktop state changes on to be kept', async () => {
      const onDesktopOpenChange = vi.fn();
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: ({ children }) => (
          <SidebarProvider onDesktopOpenChange={onDesktopOpenChange}>
            {children}
          </SidebarProvider>
        ),
      });

      act(() => {
        result.current?.setIsSidebarOpen(false);
      });

      await waitFor(() => {
        expect(result.current?.isSidebarOpen).toBe(false);
      });
      expect(onDesktopOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('before the width is known', () => {
    it('should know the desktop state', () => {
      useMediaMock.mockReturnValue(false);

      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      expect(result.current?.isSidebarOpen).toBe(false);
      expect(result.current?.isDesktopSidebarOpen).toBe(true);
    });
  });
});
