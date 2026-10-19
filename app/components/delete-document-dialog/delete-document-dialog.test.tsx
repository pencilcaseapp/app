import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { setViewportWidth } from '~/utils/testing';
import { DeleteDocumentDialog } from './delete-document-dialog';

const documentId = '11111111-1111-1111-1111-111111111111';
const otherDocumentId = '22222222-2222-2222-2222-222222222222';
const onOpenChange = vi.fn();

function renderDialog({
  open = true,
  shared = false,
  isOwner = true,
  action = async () => ({ ok: true, id: documentId }),
  openDocumentId = documentId,
  leaveAction = async () => ({ ok: true, id: documentId }),
}: {
  open?: boolean;
  shared?: boolean;
  isOwner?: boolean;
  action?: (args: ActionFunctionArgs) => unknown;
  openDocumentId?: string;
  leaveAction?: (args: ActionFunctionArgs) => unknown;
} = {}) {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => <p>Start page</p>,
    },
    {
      path: '/doc/:id',
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <DeleteDocumentDialog
            documentId={documentId}
            documentTitle="Meeting notes"
            shared={shared}
            isOwner={isOwner}
            open={open}
            onOpenChange={onOpenChange}
          />
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/doc/:id/delete',
      action,
    },
    {
      path: '/doc/:id/leave',
      action: leaveAction,
    },
  ]);

  const element = <Stub initialEntries={[`/doc/${openDocumentId}`]} />;

  return { ...render(element), element };
}

afterEach(() => {
  vi.clearAllMocks();
  setViewportWidth(1024);
});

describe('DeleteDocumentDialog', () => {
  test('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('names the document and the way back in the copy', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete document')).toBeInTheDocument();
    expect(screen.getByText(
      '“Meeting notes” will be moved to Deleted. You can restore it from'
      + ' Deleted for 30 days, after that it is permanently deleted.',
    )).toBeInTheDocument();
  });

  test('warns that a shared document goes away for everyone', () => {
    renderDialog({ shared: true });

    expect(screen.getByText(
      '“Meeting notes” will be deleted for everyone it is shared with. You'
      + ' can restore it from Deleted for 30 days, after that it is'
      + ' permanently deleted.',
    )).toBeInTheDocument();
  });

  test('tells a collaborator it stays for everybody else', () => {
    renderDialog({ isOwner: false, shared: true });

    expect(screen.getByText(
      '“Meeting notes” will be removed from your documents. It is not'
      + ' deleted for the owner or anyone else it is shared with.',
    )).toBeInTheDocument();
  });

  test('posts a collaborator\'s delete to the leave route', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ ok: true, id: documentId }));
    const leaveAction = vi.fn(async () => ({ ok: true, id: documentId }));
    renderDialog({ isOwner: false, action, leaveAction });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Start page')).toBeInTheDocument();
    expect(leaveAction).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
  });

  test('closes through the cancel button without deleting', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ ok: true, id: documentId }));
    renderDialog({ action });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(action).not.toHaveBeenCalled();
  });

  test('posts to the delete route and closes once it is done', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async ({ request }: ActionFunctionArgs) => {
      const formData = await request.formData();

      return { ok: true, id: documentId, csrf: formData.get('csrf') };
    });
    renderDialog({ action });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(await action.mock.results[0].value).toMatchObject({
      csrf: 'test-token',
    });
  });

  test('closes again when the same document is deleted again', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ ok: true, id: documentId }));
    renderDialog({ action, openDocumentId: otherDocumentId });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    // Restored in between, then deleted once more from the same dialog.
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenCalledTimes(2);
  });

  test('closes only once', async () => {
    const user = userEvent.setup();
    const { rerender, element } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    rerender(element);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  test('goes to the start page after deleting the open document', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Start page')).toBeInTheDocument();
  });

  test('stays on the open document when deleting another one', async () => {
    const user = userEvent.setup();
    renderDialog({ openDocumentId: otherDocumentId });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(screen.queryByText('Start page')).not.toBeInTheDocument();
  });
});
