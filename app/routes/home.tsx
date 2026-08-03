import { href, redirect, type MiddlewareFunction } from 'react-router';
import type { Route } from './+types/home';
import { userSessionContext } from '~/contexts/user-session';
import { getDocumentList } from '~/repos/document';
import { authMiddleware } from '~/middleware/auth';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const documentList = await getDocumentList(user.id);

  if (documentList.length > 0) {
    return redirect(href('/doc/:id', { id: documentList[0].id }));
  }

  return redirect(href('/new'));
}
