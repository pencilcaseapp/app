import { data } from 'react-router';
import { z } from 'zod';
import { getConfig } from '~/config';
import { signInE2eUser } from '~/services/auth';
import type { Route } from './+types/e2e-auth';

const bodySchema = z.object({
  email: z.email(),
});

export async function action({ request }: Route.ActionArgs) {
  const { e2e } = getConfig();

  if (!e2e) {
    throw data('Not Found', { status: 404 });
  }

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${e2e.apiToken}`) {
    throw data('Unauthorized', { status: 401 });
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    throw data('Bad Request', { status: 400 });
  }

  const sessionCookie = await signInE2eUser(request, body.data.email);

  return data({ ok: true }, {
    headers: {
      'Set-Cookie': sessionCookie,
    },
  });
}
