import { href, redirect } from 'react-router';
import type { Route } from './+types/home';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getDocumentList } from '~/repos/document';

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const documentList = user ? await getDocumentList(user.id) : [];

  if (documentList.length > 0) {
    return redirect(href('/doc/:id', { id: documentList[0].id }));
  }

  return redirect(href('/new'));
}
