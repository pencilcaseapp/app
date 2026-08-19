import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { setViewportWidth } from '~/utils/testing';
import { SharePanel } from './share-panel';

const documentId = '11111111-1111-1111-1111-111111111111';
const shareUrl = `https://docs.pencilcase.app/doc/${documentId}`;

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
            defaultOpen={defaultOpen}
          />
        </AuthenticityTokenProvider>
      ),
    },
  ]);

  return render(<Stub initialEntries={[`/doc/${documentId}`]} />);
}

afterEach(() => {
  vi.clearAllMocks();
  setViewportWidth(1024);
});

describe('SharePanel', () => {
  test('renders the share trigger button', () => {
    renderSharePanel({ defaultOpen: false });

    expect(
      screen.getByRole('button', { name: 'Share' }),
    ).toBeInTheDocument();
  });

  test('renders the trigger without its label on phones', () => {
    setViewportWidth(390);
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

  test('reflects the unshared state', () => {
    renderSharePanel({ shared: false });

    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeDisabled();
  });

  test('reflects the shared state', () => {
    renderSharePanel({ shared: true });

    expect(screen.getByRole('switch')).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Copy link' }),
    ).not.toBeDisabled();
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
