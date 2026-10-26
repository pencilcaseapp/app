import { data, type MiddlewareFunction } from 'react-router';
import {
  reportFormSchema,
} from '~/components/report-document-dialog/report-document-dialog';
import { documentReportCopies } from '~/constants/document';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { reportDocument, ReportDocumentError } from '~/services/document';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-report';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/**
 * Reports a document somebody else owns. Posted to from the report sheet
 * of the top bar, whose fetcher shows the answer.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, reportFormSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error] = await reportDocument({
    documentId: params.id,
    user,
    reason: form.data.reason,
    details: form.data.details,
  });

  if (error === ReportDocumentError.PermissionDenied) {
    throw data('Forbidden', { status: 403 });
  }

  if (error === ReportDocumentError.TooManyReports) {
    return {
      ok: false as const,
      error: documentReportCopies.tooManyReports,
    };
  }

  return { ok: true as const };
}
