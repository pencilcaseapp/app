import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRoutesStub, type ActionFunctionArgs } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { documentReportCopies } from '~/constants/document';
import { ToastProvider } from '~/ui/toast/toast-provider';
import { ReportDocumentDialog } from './report-document-dialog';

const documentId = '11111111-1111-1111-1111-111111111111';

function renderDialog({
  signInUrl = null,
  action = async () => ({ ok: true }),
}: {
  signInUrl?: string | null;
  action?: (args: ActionFunctionArgs) => unknown;
} = {}) {
  const Stub = createRoutesStub([
    {
      path: '/doc/:id',
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <ToastProvider>
            <ReportDocumentDialog
              documentId={documentId}
              signInUrl={signInUrl}
            />
          </ToastProvider>
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/doc/:id/report',
      action,
    },
  ]);

  return render(<Stub initialEntries={[`/doc/${documentId}`]} />);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('ReportDocumentDialog', () => {
  test('opens from the Report button', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Report' }));

    expect(await screen.findByRole('dialog', { name: 'Report document' }))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toHaveValue('');
  });

  test('marks a missing reason instead of sending', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ ok: true }));
    renderDialog({ action });

    await user.click(screen.getByRole('button', { name: 'Report' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      dialog.querySelector('button[type="submit"]') as HTMLElement,
    );

    const reason = screen.getByLabelText('Reason');
    expect(await screen.findByText(documentReportCopies.reasonRequired))
      .toBeInTheDocument();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(action).not.toHaveBeenCalled();

    await user.selectOptions(reason, 'spam');

    await vi.waitFor(() => {
      expect(screen.queryByText(documentReportCopies.reasonRequired))
        .not.toBeInTheDocument();
    });
  });

  test('posts the reason and details, then closes with a toast',
    async () => {
      const user = userEvent.setup();
      const action = vi.fn(async ({ request }: ActionFunctionArgs) => {
        const formData = await request.formData();

        return {
          ok: true,
          fields: Object.fromEntries(formData),
        };
      });
      renderDialog({ action });

      await user.click(screen.getByRole('button', { name: 'Report' }));
      await user.selectOptions(
        await screen.findByLabelText('Reason'),
        'spam',
      );
      await user.type(
        screen.getByLabelText('Details'),
        'Links to a fake shop.',
      );
      const dialog = screen.getByRole('dialog');
      await user.click(
        dialog.querySelector('button[type="submit"]') as HTMLElement,
      );

      expect(await screen.findByText(documentReportCopies.sent))
        .toBeInTheDocument();
      expect(await action.mock.results[0].value).toMatchObject({
        fields: {
          csrf: 'test-token',
          reason: 'spam',
          details: 'Links to a fake shop.',
        },
      });
      await vi.waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Report document' }))
          .not.toBeInTheDocument();
      });
    });

  test('stays open and says so when the limit is reached', async () => {
    const user = userEvent.setup();
    renderDialog({
      action: async () => ({
        ok: false,
        error: documentReportCopies.tooManyReports,
      }),
    });

    await user.click(screen.getByRole('button', { name: 'Report' }));
    await user.selectOptions(await screen.findByLabelText('Reason'), 'other');
    const dialog = screen.getByRole('dialog');
    await user.click(
      dialog.querySelector('button[type="submit"]') as HTMLElement,
    );

    expect(await screen.findByRole('alert'))
      .toHaveTextContent(documentReportCopies.tooManyReports);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('asks a signed out visitor to sign in first', async () => {
    const user = userEvent.setup();
    renderDialog({ signInUrl: '/signin?returnUrl=%2Fdoc' });

    await user.click(screen.getByRole('button', { name: 'Report' }));

    expect(await screen.findByRole('link', { name: 'Sign in' }))
      .toHaveAttribute('href', '/signin?returnUrl=%2Fdoc');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
