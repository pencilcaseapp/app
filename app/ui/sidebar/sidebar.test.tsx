import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';
import { SidebarProvider } from '../sidebar-context/sidebar-provider';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import type { SidebarMenuItem } from './types';

const useMediaMock = vi.fn();
const useLocalStorageMock = vi.fn();

vi.mock('react-use', async () => {
  return {
    useMedia: () => useMediaMock(),
    useLocalStorage: () => useLocalStorageMock(),
  };
});

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
        <Sidebar items={items} />
      </SidebarProvider>
    </MemoryRouter>,
  );

afterEach(() => {
  vi.clearAllMocks();
});

describe('Sidebar', () => {
  it('renders the navigation items open by default on desktop', () => {
    useMediaMock.mockReturnValue(true);
    useLocalStorageMock.mockReturnValue([true, () => {}]);

    const { getByText } = renderSidebar();

    expect(getByText('Documents')).toBeInTheDocument();
    expect(getByText('Settings')).toBeInTheDocument();
  });

  it('keeps the sidebar closed by default on smaller views', () => {
    useMediaMock.mockReturnValue(false);
    useLocalStorageMock.mockReturnValue([false, () => {}]);

    const { queryByText } = renderSidebar();

    expect(queryByText('Documents')).not.toBeInTheDocument();
  });

  it('opens the sidebar on smaller views when toggled', async () => {
    useMediaMock.mockReturnValue(false);
    useLocalStorageMock.mockReturnValue([false, () => {}]);

    const { getByText, findByText } = renderSidebar();

    await userEvent.click(getByText('Toggle'));

    expect(await findByText('Documents')).toBeInTheDocument();
  });

  it('matches the snapshot on desktop', () => {
    useMediaMock.mockReturnValue(true);
    useLocalStorageMock.mockReturnValue([true, () => {}]);

    const { container } = renderSidebar();

    expect(container).toMatchSnapshot();
  });
});
