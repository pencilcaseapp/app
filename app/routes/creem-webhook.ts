import { data } from 'react-router';
import {
  handleCreemWebhook,
  HandleCreemWebhookError,
} from '~/services/subscription';
import type { Route } from './+types/creem-webhook';

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw data('Method Not Allowed', { status: 405 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('creem-signature');

  const [error] = await handleCreemWebhook(rawBody, signature);

  if (error === null) {
    return data({ received: true });
  }

  switch (error) {
    case HandleCreemWebhookError.InvalidSignature: {
      throw data('Unauthorized', { status: 401 });
    }

    case HandleCreemWebhookError.MalformedPayload: {
      throw data('Bad Request', { status: 400 });
    }

    default: {
      const exhaustiveCheck: never = error;
      throw new Error(`Unhandled error: ${exhaustiveCheck}`);
    }
  }
}
