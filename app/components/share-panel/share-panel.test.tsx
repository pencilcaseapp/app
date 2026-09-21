import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { SharePanel } from './share-panel';

vi.mock('~/hooks/use-is-mobile');

const documentId = '11111111-1111-1111-1111-111111111111';
const shareUrl = `https://docs.pencilcase.app/doc/${documentId}`;
const owner = { name: 'Ada Lovelace', email: 'ada@pencilcase.app' };

function renderSharePanel({
  shared = false,
  defaultOpen = true,
  action = async () => ({ ok: true }),
}: {
  shared?: boolean;
  defaultOpen?: boolean;
  action?: (args: ActionFunctionArgs) => unknown;
} = {}) {
  const Stub = createRoutesStub([
    {
      path: '/doc/:id',
      action,
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <SharePanel
            documentId={documentId}
            shared={shared}
            shareUrl={shareUrl}
            owner={owner}
            defaultOpen={defaultOpen}
          />
        </AuthenticityTokenProvider>
      ),
    },
  ]);

  return render(<Stub initialEntries={[`/doc/${documentId}`]} />);
}

function stubShare() {
  const share = vi.fn(async () => {});

  Object.defineProperty(navigator, 'share', {
    value: share,
    configurable: true,
    writable: true,
  });

  return share;
}

beforeEach(() => {
  vi.mocked(useIsMobile).mockReturnValue(false);
});

afterEach(() => {
  vi.clearAllMocks();
  Reflect.deleteProperty(navigator, 'share');
});

describe('SharePanel', () => {
  test('renders the share trigger button', () => {
    renderSharePanel({ defaultOpen: false });

    expect(
      screen.getByRole('button', { name: 'Share' }),
    ).toBeInTheDocument();
  });

  test('renders the trigger without its label on phones', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    renderSharePanel({ defaultOpen: false });

    const trigger = screen.getByRole('button', { name: 'Share' });

    // The label lives in the icon, so the button keeps its accessible name.
    expect(screen.getByTitle('Share')).toBeInTheDocument();
    expect(trigger.querySelector('span')).toBeNull();
  });

  test('opens the panel from the trigger', async () => {
    const user = userEvent.setup();
    renderSharePanel({ defaultOpen: false });

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(screen.getByText('Share document')).toBeInTheDocument();
  });

  test('opens the panel as a drawer on phones', async () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    const user = userEvent.setup();
    renderSharePanel({ defaultOpen: false });

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Share document')).toBeInTheDocument();
  });

  test('reflects the unshared state', () => {
    renderSharePanel({ shared: false });

    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeDisabled();
    expect(
      screen.getByText('Right now only you can open it'),
    ).toBeInTheDocument();
  });

  test('reflects the shared state', () => {
    renderSharePanel({ shared: true });

    expect(screen.getByRole('switch')).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Copy link' }),
    ).not.toBeDisabled();
    expect(
      screen.getByText('No sign-in needed to open it'),
    ).toBeInTheDocument();
  });

  test('lists the owner under the people with access', () => {
    renderSharePanel({ shared: true });

    expect(screen.getByText('People with access')).toBeInTheDocument();
    expect(screen.getByText(owner.name)).toBeInTheDocument();
    expect(screen.getByText(owner.email)).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  test('falls back to the email of an owner without a name', () => {
    const Stub = createRoutesStub([
      {
        path: '/doc/:id',
        Component: () => (
          <AuthenticityTokenProvider token="test-token">
            <SharePanel
              documentId={documentId}
              shared
              shareUrl={shareUrl}
              owner={{ name: null, email: owner.email }}
              defaultOpen
            />
          </AuthenticityTokenProvider>
        ),
      },
    ]);

    render(<Stub initialEntries={[`/doc/${documentId}`]} />);

    expect(screen.getByText(owner.email)).toBeInTheDocument();
  });

  test('shares through the native sheet on phones', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const share = stubShare();
    vi.mocked(useIsMobile).mockReturnValue(true);

    renderSharePanel({ shared: true });

    expect(
      screen.queryByRole('button', { name: 'Copy link' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Share link' }));

    expect(share).toHaveBeenCalledExactlyOnceWith({ url: shareUrl });
  });

  test('keeps the copy button on phones without the share sheet', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);

    renderSharePanel({ shared: true });

    expect(
      screen.getByRole('button', { name: 'Copy link' }),
    ).toBeInTheDocument();
  });

  test('submits the new sharing state to the document action', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let submittedShared: FormDataEntryValue | null = null;

    renderSharePanel({
      shared: false,
      action: async ({ request }) => {
        submittedShared = (await request.formData()).get('shared');
        return { ok: true };
      },
    });

    await user.click(screen.getByRole('switch'));

    await vi.waitFor(() => expect(submittedShared).toBe('true'));
  });

  test('optimistically checks the switch while submitting', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSharePanel({
      shared: false,
      action: () => new Promise(() => {}),
    });

    const toggle = screen.getByRole('switch');
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await vi.waitFor(() => expect(toggle).toBeChecked());
  });
});
