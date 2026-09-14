import { href, Link, redirect, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { ControlledSubmitButton } from '~/components/controlled-submit-button/controlled-submit-button';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import { commonCopies } from '~/constants/common-copies';
import { emailChangeCopies } from '~/constants/email-change';
import { userSessionContext } from '~/contexts/user-session';
import { useAppForm } from '~/hooks/use-app-form';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { authMiddleware } from '~/middleware/auth';
import { initEmailChange, InitEmailChangeError } from '~/services/email-change';
import { Button } from '~/ui/button/button';
import { Typography } from '~/ui/typography/typography';
import { returnFormError, validateForm } from '~/utils/form';
import type { Route } from './+types/settings-account-email';

const formSchema = z.object({
  email: z.email(),
});

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const errorMessages: Record<InitEmailChangeError, string> = {
  [InitEmailChangeError.SameEmail]: emailChangeCopies.sameEmail,
  [InitEmailChangeError.EmailTaken]: emailChangeCopies.emailTaken,
  [InitEmailChangeError.TooManyRequests]: emailChangeCopies.tooManyRequests,
};

export function loader({ params }: Route.LoaderArgs) {
  return {
    accountUrl: href('/doc/:id/settings/account', { id: params.id }),
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);

  if (!form.ok) {
    return form.formState;
  }

  const [error, result] = await initEmailChange(user, form.data.email);

  if (error !== null) {
    return returnFormError(form.data, {
      email: { message: errorMessages[error] },
    });
  }

  return redirect(href('/doc/:id/settings/account/email/:requestId', {
    id: params.id,
    requestId: result.request.id,
  }));
}

/*
 * The first step of changing the e-mail, stacked on the account section:
 * the new address, which the code of the next step goes to.
 */
export default function SettingsAccountEmailRoute({
  loaderData: { accountUrl },
}: Route.ComponentProps) {
  const isMobile = useIsMobile();

  const form = useAppForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onBlur: formSchema,
    },
  });

  return (
    <SettingsDialogContentInner
      section="account"
      title="Change e-mail"
      backTo={accountUrl}
      footerArea={(
        <form.AppForm>
          <div className="flex items-center justify-end gap-2">
            <Button
              as={Link}
              to={accountUrl}
              preventScrollReset
              colorLight="transparent"
            >
              {isMobile ? 'Back' : 'Cancel'}
            </Button>
            <ControlledSubmitButton>
              {commonCopies.actions.continue}
            </ControlledSubmitButton>
          </div>
        </form.AppForm>
      )}
    >
      <ControlledForm form={form}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Typography variant="heading3" as="h3">
              Enter new e-mail
            </Typography>
            <Typography variant="bodySmall">
              In the next step, we’ll send a verification code to your new
              e-mail address. This ensures you own the address and helps
              prevent you from being locked out of your account.
            </Typography>
          </div>
          <form.AppField name="email">
            {field => (
              <field.TextField
                type="email"
                label="E-mail"
                placeholder="your@email.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
              />
            )}
          </form.AppField>
        </div>
      </ControlledForm>
    </SettingsDialogContentInner>
  );
}
