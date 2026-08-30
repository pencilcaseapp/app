import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';
import { SidebarProvider } from '../sidebar-context/sidebar-provider';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import type { SidebarMenuItem } from './types';

const DESKTOP_QUERY = '(min-width: 1280px)';
const MOBILE_QUERY = '(max-width: 640px)';

const useMediaMock = vi.fn();
const useLocalStorageMock = vi.fn();

vi.mock('react-use', async () => {
  return {
    useMedia: (query: string) => useMediaMock(query),
    useLocalStorage: () => useLocalStorageMock(),
  };
});

const mockViewport = (viewport: 'mobile' | 'tablet' | 'desktop') => {
  useMediaMock.mockImplementation((query: string) => {
    if (viewport === 'desktop') return query === DESKTOP_QUERY;
    if (viewport === 'mobile') return query === MOBILE_QUERY;
    return false;
  });
};

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

const ToggleButton = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebarContext();

  return (
    <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
      Toggle
    </button>
  );
};

const items: SidebarMenuItem[] = [
  { key: '1', content: 'Documents' },
  { key: '2', content: 'Settings' },
];

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <SidebarProvider>
        <ToggleButton />
        <Sidebar items={items} bottomArea="Create Doc" />
      </SidebarProvider>
    </MemoryRouter>,
  );

describe('Sidebar', () => {
  it('renders the navigation items open by default on desktop', () => {
    mockViewport('desktop');
    useLocalStorageMock.mockReturnValue([true, () => {}]);

    const { getByText } = renderSidebar();

    expect(getByText('Documents')).toBeInTheDocument();
    expect(getByText('Settings')).toBeInTheDocument();
  });

  it('keeps the sidebar closed by default on tablet', () => {
    mockViewport('tablet');
    useLocalStorageMock.mockReturnValue([false, () => {}]);

    const { queryByText } = renderSidebar();

    expect(queryByText('Documents')).not.toBeInTheDocument();
  });

  it('opens the sidebar on tablet when toggled', async () => {
    mockViewport('tablet');
    useLocalStorageMock.mockReturnValue([false, () => {}]);

    const { getByText, findByText } = renderSidebar();

    await userEvent.click(getByText('Toggle'));

    expect(await findByText('Documents')).toBeInTheDocument();
  });

  it('keeps the drawer closed by default on mobile', () => {
    mockViewport('mobile');
    useLocalStorageMock.mockReturnValue([false, () => {}]);

    const { queryByRole, queryByText } = renderSidebar();

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(queryByText('Documents')).not.toBeInTheDocument();
  });

  it('opens a drawer with the navigation items on mobile', async () => {
    mockViewport('mobile');
    useLocalStorageMock.mockReturnValue([false, () => {}]);

    const { getByText, findByRole } = renderSidebar();

    await userEvent.click(getByText('Toggle'));

    const dialog = await findByRole('dialog');

    expect(dialog).toBeInTheDocument();
    expect(getByText('Documents')).toBeInTheDocument();
    expect(getByText('Create Doc')).toBeInTheDocument();
  });

  it('matches the snapshot on desktop', () => {
    mockViewport('desktop');
    useLocalStorageMock.mockReturnValue([true, () => {}]);

    const { container } = renderSidebar();

    expect(container).toMatchSnapshot();
  });
});
