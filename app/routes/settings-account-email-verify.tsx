import { href, redirect, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { ControlledSubmitButton } from '~/components/controlled-submit-button/controlled-submit-button';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import { emailChangeCopies } from '~/constants/email-change';
import { SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { useAppForm } from '~/hooks/use-app-form';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { authMiddleware } from '~/middleware/auth';
import { getValidEmailChangeRequest } from '~/repos/email-change-request';
import { signOutOtherSessions } from '~/services/auth';
import {
  initEmailChange,
  InitEmailChangeError,
  verifyEmailChange,
  VerifyEmailChangeError,
} from '~/services/email-change';
import { Typography } from '~/ui/typography/typography';
import { returnFormError, validateForm } from '~/utils/form';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/settings-account-email-verify';

const formSchemaVerify = z.object({
  action: z.literal('verify'),
  otp: z.string().length(6, 'Code must be 6 digits'),
});

const formSchemaResend = z.object({
  action: z.literal('resend'),
});

const formSchema = z.discriminatedUnion('action', [
  formSchemaVerify,
  formSchemaResend,
]);

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

function getUrls(id: string) {
  return {
    accountUrl: href('/doc/:id/settings/account', { id }),
    emailUrl: href('/doc/:id/settings/account/email', { id }),
  };
}

function redirectWithDanger(url: string, message: string) {
  return redirect(withSearchParams(url, {
    [SearchParamToast.ToastDanger]: message,
  }));
}

/**
 * A request that is gone, spent or somebody else's sends the user back
 * to the address step; the toast tells them why.
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const { accountUrl, emailUrl } = getUrls(params.id);
  const request = await getValidEmailChangeRequest(params.requestId);

  if (!request || request.userId !== user.id) {
    return redirectWithDanger(emailUrl, emailChangeCopies.expired);
  }

  return {
    email: request.email,
    accountUrl,
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);
  const { accountUrl, emailUrl } = getUrls(params.id);

  if (!form.ok) {
    return form.formState;
  }

  switch (form.data.action) {
    case 'verify': {
      const [error] = await verifyEmailChange(
        user, params.requestId, form.data.otp,
      );

      if (error !== null) {
        switch (error) {
          case VerifyEmailChangeError.Invalid: {
            return returnFormError(form.data, {
              otp: { message: emailChangeCopies.invalidCode },
            });
          }

          case VerifyEmailChangeError.Expired: {
            return redirectWithDanger(emailUrl, emailChangeCopies.expired);
          }

          case VerifyEmailChangeError.EmailTaken: {
            return redirectWithDanger(emailUrl, emailChangeCopies.emailTaken);
          }

          default: {
            const exhaustiveCheck: never = error;
            throw new Error('Unhandled error case: ' + exhaustiveCheck);
          }
        }
      }

      // The old mailbox could sign in until now; its sessions end here.
      await signOutOtherSessions(request, user.id);

      return redirect(withSearchParams(accountUrl, {
        [SearchParamToast.ToastSuccess]: emailChangeCopies.changed,
      }));
    }

    case 'resend': {
      const pending = await getValidEmailChangeRequest(params.requestId);

      if (!pending || pending.userId !== user.id) {
        return redirectWithDanger(emailUrl, emailChangeCopies.expired);
      }

      const [error, result] = await initEmailChange(user, pending.email);

      if (error !== null) {
        switch (error) {
          case InitEmailChangeError.TooManyRequests: {
            return redirectWithDanger(
              href('/doc/:id/settings/account/email/:requestId', {
                id: params.id,
                requestId: params.requestId,
              }),
              emailChangeCopies.tooManyRequests,
            );
          }

          case InitEmailChangeError.EmailTaken: {
            return redirectWithDanger(emailUrl, emailChangeCopies.emailTaken);
          }

          case InitEmailChangeError.SameEmail: {
            return redirectWithDanger(emailUrl, emailChangeCopies.sameEmail);
          }

          default: {
            const exhaustiveCheck: never = error;
            throw new Error('Unhandled error case: ' + exhaustiveCheck);
          }
        }
      }

      return redirect(href('/doc/:id/settings/account/email/:requestId', {
        id: params.id,
        requestId: result.request.id,
      }));
    }
  }
}

/*
 * The second step of changing the e-mail: the code sent to the new
 * address. Verify and resend are two forms, like the sign-in code page;
 * off mobile their buttons sit in the footer, on mobile below the code.
 */
export default function SettingsAccountEmailVerifyRoute({
  loaderData: { email, accountUrl },
}: Route.ComponentProps) {
  const isMobile = useIsMobile();

  const formVerify = useAppForm({
    defaultValues: {
      otp: '',
      action: 'verify',
    },
    validators: {
      onSubmit: formSchemaVerify,
    },
  });

  const formResend = useAppForm({
    defaultValues: {
      action: 'resend',
    },
    validators: {
      onSubmit: formSchemaResend,
    },
  });

  const verifyButton = (
    <formVerify.AppForm>
      <ControlledSubmitButton className={isMobile ? 'w-full' : undefined}>
        Verify
      </ControlledSubmitButton>
    </formVerify.AppForm>
  );

  const resendButton = (
    <formResend.AppForm>
      <ControlledSubmitButton
        colorLight="transparent"
        colorDark="transparent"
        className={isMobile ? 'w-full' : undefined}
      >
        Resend
      </ControlledSubmitButton>
    </formResend.AppForm>
  );

  return (
    <SettingsDialogContentInner
      section="account"
      title="Change e-mail"
      backTo={accountUrl}
      footerArea={isMobile
        ? undefined
        : (
            <div className="flex items-center justify-end gap-2">
              {resendButton}
              {verifyButton}
            </div>
          )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Typography variant="heading3" as="h3">
            Enter code
          </Typography>
          <Typography variant="bodySmall">
            We sent a verification code to:
            <br />
            <Typography variant="bodySmall" fontWeight="semibold" as="span">
              {email}
            </Typography>
          </Typography>
        </div>
        <ControlledForm form={formVerify}>
          <formVerify.AppField name="action">
            {field => <field.HiddenInput />}
          </formVerify.AppField>
          <formVerify.AppField name="otp">
            {field => (
              <field.OneTimePasswordField
                label="Verification Code"
                hint="Check your inbox for the code."
                className="max-w-85"
              />
            )}
          </formVerify.AppField>
        </ControlledForm>
        <ControlledForm form={formResend}>
          <formResend.AppField name="action">
            {field => <field.HiddenInput />}
          </formResend.AppField>
        </ControlledForm>
        {isMobile && (
          <div className="flex flex-col gap-2">
            {verifyButton}
            {resendButton}
          </div>
        )}
      </div>
    </SettingsDialogContentInner>
  );
}
