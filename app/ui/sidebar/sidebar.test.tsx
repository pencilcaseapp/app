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

vi.mock('react-use', async () => {
  return {
    useMedia: (query: string) => useMediaMock(query),
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

const renderSidebar = (defaultDesktopOpen = true) =>
  render(
    <MemoryRouter>
      <SidebarProvider defaultDesktopOpen={defaultDesktopOpen}>
        <ToggleButton />
        <Sidebar items={items} bottomArea="Create Doc" />
      </SidebarProvider>
    </MemoryRouter>,
  );

describe('Sidebar', () => {
  it('renders the navigation items open by default on desktop', () => {
    mockViewport('desktop');

    const { getByText } = renderSidebar();

    expect(getByText('Documents')).toBeInTheDocument();
    expect(getByText('Settings')).toBeInTheDocument();
  });

  it('renders the desktop sidebar closed when the reader closed it', () => {
    mockViewport('desktop');

    const { container } = renderSidebar(false);

    expect(container.querySelector('.fixed')).toHaveStyle({
      transform: 'translateX(-100%)',
    });
  });

  it('keeps the sidebar closed by default on tablet', () => {
    mockViewport('tablet');

    const { queryByRole } = renderSidebar();

    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the sidebar on tablet when toggled', async () => {
    mockViewport('tablet');

    const { getByText, findByRole } = renderSidebar();

    await userEvent.click(getByText('Toggle'));

    expect(await findByRole('dialog')).toHaveTextContent('Documents');
  });

  it('keeps the page mounted when the width turns out to be mobile', () => {
    mockViewport('desktop');
    const page = vi.fn(() => <main>Page</main>);
    const Page = () => page();
    const { rerender } = render(
      <MemoryRouter>
        <SidebarProvider>
          <Sidebar items={items}><Page /></Sidebar>
        </SidebarProvider>
      </MemoryRouter>,
    );
    const main = document.querySelector('main');

    mockViewport('mobile');
    rerender(
      <MemoryRouter>
        <SidebarProvider>
          <Sidebar items={items}><Page /></Sidebar>
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(document.querySelector('main')).toBe(main);
  });

  it('keeps the drawer closed by default on mobile', () => {
    mockViewport('mobile');

    const { queryByRole, queryByText } = renderSidebar();

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(queryByText('Documents')).not.toBeInTheDocument();
  });

  it('opens a drawer with the navigation items on mobile', async () => {
    mockViewport('mobile');

    const { getByText, findByRole } = renderSidebar();

    await userEvent.click(getByText('Toggle'));

    const dialog = await findByRole('dialog');

    expect(dialog).toBeInTheDocument();
    expect(getByText('Documents')).toBeInTheDocument();
    expect(getByText('Create Doc')).toBeInTheDocument();
  });

  it('matches the snapshot on desktop', () => {
    mockViewport('desktop');

    const { container } = renderSidebar();

    expect(container).toMatchSnapshot();
  });
});
