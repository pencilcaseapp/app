import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { RestoreDocumentMenu } from './restore-document-menu';

const documentId = '11111111-1111-1111-1111-111111111111';

function renderMenu(action: (args: ActionFunctionArgs) => unknown) {
  const Stub = createRoutesStub([
    {
      path: '/doc/:id',
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <RestoreDocumentMenu documentId={documentId} defaultOpen />
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/doc/:id/restore',
      action,
    },
  ]);

  return render(<Stub initialEntries={[`/doc/${documentId}`]} />);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('RestoreDocumentMenu', () => {
  test('posts to the restore route of the document', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const action = vi.fn(async ({ request, params }: ActionFunctionArgs) => {
      const formData = await request.formData();

      return { id: params.id, csrf: formData.get('csrf') };
    });
    renderMenu(action);

    await user.click(screen.getByRole('menuitem', { name: 'Restore' }));

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
    });
    expect(await action.mock.results[0].value).toStrictEqual({
      id: documentId,
      csrf: 'test-token',
    });
  });
});
