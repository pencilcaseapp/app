import { href, redirect } from 'react-router';
import { signOut } from '~/services/auth';
import type { Route } from './+types/signout';

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = await signOut(request);

  return redirect(href('/'), {
    headers: {
      'Set-Cookie': cookieHeader,
    },
  });
}
