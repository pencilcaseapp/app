import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { setViewportWidth } from '~/utils/testing';
import { DeleteDocumentDialog } from './delete-document-dialog';

const documentId = '11111111-1111-1111-1111-111111111111';
const onOpenChange = vi.fn();
const onDeleted = vi.fn();

function renderDialog({
  open = true,
  action = async () => ({ ok: true, id: documentId }),
}: {
  open?: boolean;
  action?: (args: ActionFunctionArgs) => unknown;
} = {}) {
  const Stub = createRoutesStub([
    {
      path: '/doc/:id',
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <DeleteDocumentDialog
            documentId={documentId}
            documentTitle="Meeting notes"
            open={open}
            onOpenChange={onOpenChange}
            onDeleted={onDeleted}
          />
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/doc/:id/delete',
      action,
    },
  ]);

  const element = <Stub initialEntries={[`/doc/${documentId}`]} />;

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

  test('names the document in the confirmation copy', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete document')).toBeInTheDocument();
    expect(
      screen.getByText(/“Meeting notes” will be deleted/),
    ).toBeInTheDocument();
  });

  test('closes through the cancel button without deleting', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ ok: true, id: documentId }));
    renderDialog({ action });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(action).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
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
      expect(onDeleted).toHaveBeenCalledWith(documentId);
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(await action.mock.results[0].value).toMatchObject({
      csrf: 'test-token',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('reports the deletion only once', async () => {
    const user = userEvent.setup();
    const { rerender, element } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(onDeleted).toHaveBeenCalledTimes(1);
    });

    rerender(element);

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
