import { useEffect, useRef } from 'react';
import {
  data,
  href,
  useFetcher,
  type MiddlewareFunction,
} from 'react-router';
import { z } from 'zod';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import {
  MAX_SUPPORT_MESSAGE_LENGTH,
  supportRequestCopies,
} from '~/constants/support';
import { userSessionContext } from '~/contexts/user-session';
import { useAppForm } from '~/hooks/use-app-form';
import { useIsHydrated } from '~/hooks/use-is-hydrated';
import { useEmitToast } from '~/hooks/use-toast';
import { authMiddleware } from '~/middleware/auth';
import { sendSupportRequest } from '~/services/support';
import { Typography } from '~/ui/typography/typography';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/settings-support';

const MAX_URL_LENGTH = 2048;
const MAX_USER_AGENT_LENGTH = 1000;

const messageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, supportRequestCopies.messageRequired)
    .max(MAX_SUPPORT_MESSAGE_LENGTH, supportRequestCopies.messageTooLong),
});

// The page the form was sent from rides along in a hidden input that is
// not one of the form's fields.
const formSchema = messageSchema.extend({
  url: z.string().max(MAX_URL_LENGTH),
});

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const userAgent = request.headers.get('user-agent') ?? '';
  const [error] = await sendSupportRequest({
    user,
    message: form.data.message,
    url: form.data.url,
    userAgent: userAgent.slice(0, MAX_USER_AGENT_LENGTH),
  });

  if (error !== null) {
    return { ok: false as const, error: supportRequestCopies.tooManyRequests };
  }

  return { ok: true as const };
}

export default function SettingsSupportRoute({
  params,
}: Route.ComponentProps) {
  const fetcher = useFetcher<typeof action>();
  const handledRef = useRef(fetcher.data);
  const emitToast = useEmitToast();
  const isHydrated = useIsHydrated();
  const form = useAppForm({
    defaultValues: {
      message: '',
    },
    validators: {
      onSubmit: messageSchema,
    },
  }, { fetcher });

  useEffect(() => {
    if (!fetcher.data?.ok || fetcher.data === handledRef.current) {
      return;
    }

    handledRef.current = fetcher.data;
    emitToast({ type: 'success', title: supportRequestCopies.sent });
    form.reset();
  }, [fetcher.data, emitToast, form]);

  const error = fetcher.data && !fetcher.data.ok ? fetcher.data.error : null;

  return (
    <SettingsDialogContentInner
      section="support"
      footerArea={(
        <form.AppForm>
          <div className="flex items-center justify-end">
            <form.SubmitButton>Send</form.SubmitButton>
          </div>
        </form.AppForm>
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Typography variant="heading3" as="h2">
            How can we help?
          </Typography>
          <Typography variant="bodySmall">
            Tell us what’s on your mind. We’ll get back to you by e-mail and
            help you with your case. We take your feedback seriously.
          </Typography>
        </div>
        <ControlledForm
          form={form}
          action={href('/doc/:id/settings/support', { id: params.id })}
          noValidate
        >
          <input
            type="hidden"
            name="url"
            value={isHydrated ? window.location.href : ''}
          />
          <div className="flex flex-col gap-5">
            <form.AppField name="message">
              {field => (
                <field.TextArea
                  label="Message"
                  rows={8}
                  maxLength={MAX_SUPPORT_MESSAGE_LENGTH}
                />
              )}
            </form.AppField>
            {error && (
              <Typography
                as="p"
                variant="bodyTiny"
                textColorLight="red-500"
                textColorDark="red-500"
                role="alert"
              >
                {error}
              </Typography>
            )}
          </div>
        </ControlledForm>
      </div>
    </SettingsDialogContentInner>
  );
}
