import { act, render, renderHook, waitFor } from '@testing-library/react';
import { SidebarProvider } from './sidebar-provider';
import { use } from 'react';
import { SidebarContext } from './sidebar-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useMediaMock = vi.fn();
const useLocalStorageMock = vi.fn();

vi.mock('react-use', async () => {
  const actual = await vi.importActual('react-use');
  return {
    ...actual,
    useMedia: () => useMediaMock(),
    useLocalStorage: () => useLocalStorageMock(),
  };
});

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('SidebarProvider', () => {
  describe('rendering and context provision', () => {
    it('should render children', () => {
      useMediaMock.mockReturnValue(false);
      useLocalStorageMock.mockReturnValue([false, vi.fn()]);

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
      useLocalStorageMock.mockReturnValue([false, vi.fn()]);

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
      useLocalStorageMock.mockReturnValue([true, vi.fn()]);
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
      const setDesktopSidebarOpen = vi.fn();
      useLocalStorageMock.mockReturnValue([true, setDesktopSidebarOpen]);

      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      act(() => {
        result.current?.setIsSidebarOpen(true);
      });

      await waitFor(() => {
        expect(result.current?.isSidebarOpen).toBe(true);
      });

      // setDesktopSidebarOpen should not be called on mobile
      expect(setDesktopSidebarOpen).not.toHaveBeenCalled();
    });
  });

  describe('desktop viewport behavior', () => {
    let setDesktopSidebarOpen: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      useMediaMock.mockReturnValue(true); // desktop
      setDesktopSidebarOpen = vi.fn();
      useLocalStorageMock.mockReturnValue([true, setDesktopSidebarOpen]);
    });

    it('should read persisted desktop state', () => {
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      expect(result.current?.isSidebarOpen).toBe(true);
    });

    it('should persist desktop state changes to storage', async () => {
      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      act(() => {
        result.current?.setIsSidebarOpen(false);
      });

      await waitFor(() => {
        expect(setDesktopSidebarOpen).toHaveBeenCalledWith(false);
      });
    });

    it('should normalize non-boolean stored values to true', () => {
      useLocalStorageMock.mockReturnValue([undefined, setDesktopSidebarOpen]);

      const { result } = renderHook(() => use(SidebarContext), {
        wrapper: SidebarProvider,
      });

      expect(result.current?.isSidebarOpen).toBe(true);
    });
  });
});
