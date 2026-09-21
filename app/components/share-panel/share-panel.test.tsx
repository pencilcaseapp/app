import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import type { DocumentLinkAccess } from '~/constants/document';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { ToastProvider } from '~/ui/toast/toast-provider';
import type { InvitedPerson } from './people-with-access';
import { SharePanel } from './share-panel';

vi.mock('~/hooks/use-is-mobile');

const documentId = '11111111-1111-1111-1111-111111111111';
const shareUrl = `https://docs.pencilcase.app/doc/${documentId}`;
const owner = { name: 'Ada Lovelace', email: 'ada@pencilcase.app' };
const invitedPeople: InvitedPerson[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    access: 'edit',
    pending: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: null,
    email: 'pending@example.com',
    access: 'view',
    pending: true,
  },
];

type Action = (args: ActionFunctionArgs) => unknown;

function renderSharePanel({
  shared = false,
  linkAccess = 'view' as DocumentLinkAccess,
  defaultOpen = true,
  showUpgrade = false,
  invited = [],
  action = async () => ({ ok: true }),
  shareAction = async () => ({ ok: true }),
  linkAccessAction = async () => ({ ok: true }),
  collaboratorAccessAction = async () => ({ ok: true }),
  collaboratorRemoveAction = async () => ({ ok: true }),
}: {
  shared?: boolean;
  linkAccess?: DocumentLinkAccess;
  defaultOpen?: boolean;
  showUpgrade?: boolean;
  invited?: InvitedPerson[];
  action?: Action;
  shareAction?: Action;
  linkAccessAction?: Action;
  collaboratorAccessAction?: Action;
  collaboratorRemoveAction?: Action;
} = {}) {
  const Stub = createRoutesStub([
    {
      path: '/doc/:id',
      action,
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <ToastProvider>
            <SharePanel
              documentId={documentId}
              shared={shared}
              linkAccess={linkAccess}
              shareUrl={shareUrl}
              owner={owner}
              invited={invited}
              showUpgrade={showUpgrade}
              defaultOpen={defaultOpen}
            />
          </ToastProvider>
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/doc/:id/share',
      action: shareAction,
    },
    {
      path: '/doc/:id/link-access',
      action: linkAccessAction,
    },
    {
      path: '/doc/:id/collaborators/:collaboratorId/access',
      action: collaboratorAccessAction,
    },
    {
      path: '/doc/:id/collaborators/:collaboratorId/remove',
      action: collaboratorRemoveAction,
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

/*
 * The desktop panel is a Radix menu, and happy-dom's zero-sized layout
 * makes its popper count as detached — and hide itself — as soon as it
 * settles, which is right after the first interaction. The tests that
 * type or open a row menu therefore drive the drawer variant, and read
 * the row menu's items as `hidden` — by text, since a hidden element has
 * no accessible name — because its own popper hides the same way.
 */
function drawerPanel() {
  vi.mocked(useIsMobile).mockReturnValue(true);
}

function menuItem(name: string) {
  const item = screen.getAllByRole('menuitem', { hidden: true })
    .find(element => element.textContent === name);

  if (!item) {
    throw new Error(`No menu item "${name}"`);
  }

  return item;
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
    expect(
      screen.getByText('Right now only you can open it'),
    ).toBeInTheDocument();
  });

  test('reflects the shared state', () => {
    renderSharePanel({ shared: true });

    expect(screen.getByRole('switch')).toBeChecked();
    expect(
      screen.getByText('No sign-in needed to open it'),
    ).toBeInTheDocument();
  });

  test('keeps the copy button enabled while the link is off', () => {
    renderSharePanel({ shared: false });

    expect(
      screen.getByRole('button', { name: 'Copy link' }),
    ).not.toBeDisabled();
  });

  test('lists the owner under the people with access', () => {
    renderSharePanel({ shared: true });

    expect(screen.getByRole('heading', { name: 'People with access · 1' }))
      .toBeInTheDocument();
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
            <ToastProvider>
              <SharePanel
                documentId={documentId}
                shared
                linkAccess="view"
                shareUrl={shareUrl}
                owner={{ name: null, email: owner.email }}
                defaultOpen
              />
            </ToastProvider>
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

  test('submits the new sharing state to the share action', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let submittedShared: FormDataEntryValue | null = null;

    renderSharePanel({
      shared: false,
      shareAction: async ({ request }) => {
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
      shareAction: () => new Promise(() => {}),
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
      shareAction: () => new Promise(() => {}),
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

  test('hides the invite form from an account without a subscription', () => {
    renderSharePanel({ showUpgrade: true });

    expect(screen.queryByRole('textbox', { name: 'Email address' }))
      .not.toBeInTheDocument();
  });

  test('offers the invite form to a subscriber', () => {
    renderSharePanel({ showUpgrade: false });

    expect(screen.getByRole('textbox', { name: 'Email address' }))
      .toBeInTheDocument();
    expect(screen.getByRole('combobox', {
      name: 'Access for the invited person',
    })).toHaveTextContent('Can edit');
    expect(screen.getByRole('button', { name: 'Invite' }))
      .toBeInTheDocument();
  });

  test('submits the invite to the document action', async () => {
    drawerPanel();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let submitted: Record<string, FormDataEntryValue> | null = null;

    renderSharePanel({
      action: async ({ request }) => {
        submitted = Object.fromEntries(await request.formData());
        return { ok: true, invited: { email: 'grace@example.com' } };
      },
    });

    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'grace@example.com',
    );
    await user.click(screen.getByRole('combobox', {
      name: 'Access for the invited person',
    }));
    await user.click(screen.getByRole('option', { name: 'Can view' }));
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    await vi.waitFor(() => expect(submitted).toMatchObject({
      email: 'grace@example.com',
      access: 'view',
    }));
    // The address is cleared for the next invite and the choice kept.
    await vi.waitFor(() => expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toHaveValue(''));
    expect(screen.getByRole('combobox', {
      name: 'Access for the invited person',
    })).toHaveTextContent('Can view');
    expect(await screen.findByText('Invite sent to grace@example.com'))
      .toBeInTheDocument();
  });

  test('shows the error the action puts on the address', async () => {
    drawerPanel();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSharePanel({
      action: async () => ({
        values: { email: 'grace@example.com', access: 'edit' },
        errors: [],
        errorMap: {
          onServer: {
            fields: { email: { message: 'This address is invited already' } },
          },
        },
      }),
    });

    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'grace@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(await screen.findByText('This address is invited already'))
      .toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email address' }))
      .toHaveValue('grace@example.com');
  });

  test('refuses an address that is not one before submitting', async () => {
    drawerPanel();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const action = vi.fn(async () => ({ ok: true }));

    renderSharePanel({ action });

    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'grace',
    );
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(await screen.findByText('Enter a valid email address'))
      .toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  test('lists the invited people with their access', () => {
    renderSharePanel({ invited: invitedPeople });

    expect(screen.getByRole('heading', { name: 'People with access · 3' }))
      .toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('grace@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Access for Grace Hopper' }))
      .toHaveTextContent('Can edit');
    expect(screen.getByRole('button', {
      name: 'Access for pending@example.com',
    })).toHaveTextContent('Can view');
  });

  test('badges an invite nobody has accepted yet', () => {
    renderSharePanel({ invited: invitedPeople });

    const badges = screen.getAllByText('Invited');

    expect(badges).toHaveLength(1);
    expect(badges[0].closest('li')).toHaveTextContent('pending@example.com');
  });

  test('says that invited people can open a private document', () => {
    renderSharePanel({ shared: false, invited: invitedPeople });

    expect(screen.getByText('Right now only invited people can open it'))
      .toBeInTheDocument();
  });

  test('submits a changed access to the collaborator access action', async () => {
    drawerPanel();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let submitted: { url: string; access: FormDataEntryValue | null } | null
      = null;

    renderSharePanel({
      invited: invitedPeople,
      collaboratorAccessAction: async ({ request }) => {
        submitted = {
          url: new URL(request.url).pathname,
          access: (await request.formData()).get('access'),
        };
        return { ok: true };
      },
    });

    await user.click(
      screen.getByRole('button', { name: 'Access for Grace Hopper' }),
    );
    await user.click(menuItem('Can view'));

    await vi.waitFor(() => expect(submitted).toStrictEqual({
      url: `/doc/${documentId}/collaborators/${invitedPeople[0].id}/access`,
      access: 'view',
    }));
  });

  test('optimistically shows the changed access', async () => {
    drawerPanel();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSharePanel({
      invited: invitedPeople,
      collaboratorAccessAction: () => new Promise(() => {}),
    });

    const trigger = screen.getByRole('button', {
      name: 'Access for Grace Hopper',
    });

    await user.click(trigger);
    await user.click(menuItem('Can view'));

    await vi.waitFor(() => expect(trigger).toHaveTextContent('Can view'));
  });

  test('removes the access through the collaborator remove action', async () => {
    drawerPanel();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let submittedUrl: string | null = null;

    renderSharePanel({
      invited: invitedPeople,
      collaboratorRemoveAction: async ({ request }) => {
        submittedUrl = new URL(request.url).pathname;
        return new Promise(() => {});
      },
    });

    await user.click(
      screen.getByRole('button', { name: 'Access for Grace Hopper' }),
    );
    await user.click(menuItem('Remove access'));

    await vi.waitFor(() => expect(submittedUrl).toBe(
      `/doc/${documentId}/collaborators/${invitedPeople[0].id}/remove`,
    ));
    // The row is gone while the removal is on its way.
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
  });
});
