import { href, redirect, type MiddlewareFunction } from 'react-router';
import type { Route } from './+types/startpage';
import { userSessionContext } from '~/contexts/user-session';
import { getDocumentList } from '~/services/document';
import { authMiddleware } from '~/middleware/auth';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

// The search params ride along, so a toast handed to the start page shows
// on the document it opens.
export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const documentList = await getDocumentList(user.id);
  const { search } = new URL(request.url);

  if (documentList.length > 0) {
    return redirect(href('/doc/:id', { id: documentList[0].id }) + search);
  }

  return redirect(href('/new'));
}
