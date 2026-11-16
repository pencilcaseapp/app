import { z } from 'zod';
import { getConfig } from '~/config';
import { sendContactMessage } from '~/services/contact';
import type { Route } from './+types/contact';

export const contactFormSchema = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  message: z.string().trim().min(1).max(5000),
});

/**
 * The website's contact form, posted straight from the visitor's browser
 * so the app's Bunny Shield rate limits it per visitor. No session and no
 * CSRF token are involved: the website only needs to read the answer,
 * which the CORS header allows for its origin alone.
 */
export async function action({ request }: Route.ActionArgs) {
  const headers = {
    'Access-Control-Allow-Origin': getConfig().websiteUrl,
    'Vary': 'Origin',
  };
  const formData = await request.formData();
  const form = contactFormSchema.safeParse({
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!form.success) {
    return Response.json({ sent: false }, { status: 400, headers });
  }

  await sendContactMessage(form.data);

  return Response.json({ sent: true }, { headers });
}
