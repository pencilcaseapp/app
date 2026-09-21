import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import type { DocumentLinkAccess } from '~/constants/document';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { SharePanel } from './share-panel';

vi.mock('~/hooks/use-is-mobile');

const documentId = '11111111-1111-1111-1111-111111111111';
const shareUrl = `https://docs.pencilcase.app/doc/${documentId}`;
const owner = { name: 'Ada Lovelace', email: 'ada@pencilcase.app' };

function renderSharePanel({
  shared = false,
  linkAccess = 'view' as DocumentLinkAccess,
  defaultOpen = true,
  showUpgrade = false,
  action = async () => ({ ok: true }),
  linkAccessAction = async () => ({ ok: true }),
}: {
  shared?: boolean;
  linkAccess?: DocumentLinkAccess;
  defaultOpen?: boolean;
  showUpgrade?: boolean;
  action?: (args: ActionFunctionArgs) => unknown;
  linkAccessAction?: (args: ActionFunctionArgs) => unknown;
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
            linkAccess={linkAccess}
            shareUrl={shareUrl}
            owner={owner}
            showUpgrade={showUpgrade}
            defaultOpen={defaultOpen}
          />
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/doc/:id/link-access',
      action: linkAccessAction,
    },
    {
      path: '/doc/:id/settings/subscription',
      Component: () => <p>Subscription settings</p>,
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
              linkAccess="view"
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

  test('hides the link access while the document is private', () => {
    renderSharePanel({ shared: false });

    expect(
      screen.queryByRole('combobox', { name: 'Link access' }),
    ).not.toBeInTheDocument();
  });

  test('shows the access of a shared link', () => {
    renderSharePanel({ shared: true, linkAccess: 'edit' });

    expect(screen.getByRole('combobox', { name: 'Link access' }))
      .toHaveTextContent('Can edit');
  });

  test('submits the chosen access to the link access action', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let submitted: FormDataEntryValue | null = null;

    renderSharePanel({
      shared: true,
      linkAccessAction: async ({ request }) => {
        submitted = (await request.formData()).get('linkAccess');
        return { ok: true };
      },
    });

    await user.click(screen.getByRole('combobox', { name: 'Link access' }));
    await user.click(screen.getByRole('option', { name: 'Can edit' }));

    await vi.waitFor(() => expect(submitted).toBe('edit'));
  });

  test('optimistically shows the chosen access while submitting', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSharePanel({
      shared: true,
      linkAccessAction: () => new Promise(() => {}),
    });

    const select = screen.getByRole('combobox', { name: 'Link access' });

    await user.click(select);
    await user.click(screen.getByRole('option', { name: 'Can edit' }));

    await vi.waitFor(() => expect(select).toHaveTextContent('Can edit'));
  });

  test('falls back to viewing while the link is turned on again', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSharePanel({
      shared: false,
      // What the link allowed the last time it was shared.
      linkAccess: 'edit',
      action: () => new Promise(() => {}),
    });

    await user.click(screen.getByRole('switch'));

    await vi.waitFor(() => expect(
      screen.getByLabelText('Link access'),
    ).toHaveTextContent('Can view'));
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

  test('offers the upgrade to an account without a subscription', () => {
    renderSharePanel({ showUpgrade: true });

    expect(
      screen.getByRole('link', { name: /Invite people by email/ }),
    ).toHaveAttribute('href', `/doc/${documentId}/settings/subscription`);
  });

  test('hides the upgrade offer from a subscriber', () => {
    renderSharePanel({ showUpgrade: false });

    expect(
      screen.queryByRole('link', { name: /Invite people by email/ }),
    ).not.toBeInTheDocument();
  });

  test('closes the panel when the upgrade offer is opened', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderSharePanel({ showUpgrade: true });

    await user.click(
      screen.getByRole('link', { name: /Invite people by email/ }),
    );

    expect(await screen.findByText('Subscription settings'))
      .toBeInTheDocument();
    await vi.waitFor(() => expect(
      screen.queryByText('Share document'),
    ).not.toBeInTheDocument());
  });
});
