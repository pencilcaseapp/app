import { href, redirect } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { createDocument } from '~/repos/document';
import type { Route } from './+types/new';

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const document = await createDocument({
    userId: user?.id,
  });

  return redirect(href('/doc/:id', { id: document.id }));
}
