import { z } from 'zod';
import { getConfig } from '~/config';
import { CANCELLATION_TYPES } from '~/constants/contract-notice';
import { sendContactMessage, sendContractNotice } from '~/services/contact';
import type { Route } from './+types/contact';

const email = z.string().trim().pipe(z.email().max(254));
const name = z.string().trim().min(1).max(200).regex(/^[^\r\n]*$/);

/**
 * The website's three forms, told apart by `form`: a message to us, a
 * cancellation (§ 312k BGB) and a withdrawal (§ 356a BGB). Both laws
 * allow asking for nothing but what is here; a withdrawal needs no reason.
 */
export const contactFormSchema = z.discriminatedUnion('form', [
  z.object({
    form: z.literal('message'),
    email,
    message: z.string().trim().min(1).max(5000),
  }),
  z.object({
    form: z.literal('cancellation'),
    name,
    email,
    cancellationType: z.enum(CANCELLATION_TYPES),
    reason: z.string().trim().max(5000).optional(),
    endsOn: z.union([z.iso.date(), z.literal('')]).optional(),
  }),
  z.object({
    form: z.literal('withdrawal'),
    name,
    email,
  }),
]);

/**
 * The website's forms, posted straight from the visitor's browser so the
 * app's Bunny Shield rate limits them per visitor. No session and no
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
    form: 'message',
    ...Object.fromEntries(formData),
  });

  if (!form.success) {
    return Response.json({ sent: false }, { status: 400, headers });
  }

  const { data } = form;

  if (data.form === 'message') {
    await sendContactMessage({ email: data.email, message: data.message });
  }
  else if (data.form === 'cancellation') {
    const isExtraordinary = data.cancellationType === 'extraordinary';

    await sendContractNotice({
      kind: 'cancellation',
      name: data.name,
      email: data.email,
      cancellationType: data.cancellationType,
      reason: (isExtraordinary && data.reason) || null,
      endsOn: data.endsOn || null,
    });
  }
  else {
    await sendContractNotice({
      kind: 'withdrawal',
      name: data.name,
      email: data.email,
    });
  }

  return Response.json({ sent: true }, { headers });
}
