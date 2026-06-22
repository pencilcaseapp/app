import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { useAppForm } from '~/hooks/use-app-form';
import { z } from 'zod';
import { Typography } from '~/ui/typography/typography';
import { commonCopies } from '~/constants/common-copies';
import type { Route } from './+types/otp';
import { returnFormError, validateForm } from '~/utils/form';
import { createSessionCookie, initMagicCode, verifyMagicCode, VerifyMagicCodeError } from '~/services/auth';
import { href, redirect, Link as ReactRouterLink } from 'react-router';
import { SearchParamAuth } from '~/constants/search-params';
import { getRequiredSearchParam, withSearchParams } from '~/utils/url';
import { Link } from '~/ui/link/link';
import { getValidOtp } from '~/repos/otp';

const formSchemaVerify = z.object({
  action: z.literal('verify'),
  otp: z.string().length(6, 'Code must be 6 digits'),
});

const formSchemaResend = z.object({
  action: z.literal('resend'),
});

const formSchema = z.discriminatedUnion('action', [formSchemaVerify, formSchemaResend]);

export async function loader({ request, params: { otpId } }: Route.ActionArgs) {
  const email = getRequiredSearchParam(request, SearchParamAuth.Email);
  const otp = await getValidOtp(otpId);

  if (!otp) {
    return redirect(
      withSearchParams(
        href('/signin'), {
          [SearchParamAuth.IsExpired]: 'true',
        },
      ),
    );
  }

  return {
    email,
  };
}

export async function action({ request, params: { otpId } }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const email = getRequiredSearchParam(request, SearchParamAuth.Email);

  if (!form.ok) {
    return form.formState;
  }

  switch (form.data.action) {
    case 'verify': {
      const [error, result] = await verifyMagicCode(
        otpId, email,
        form.data.otp,
      );

      if (error !== null) {
        switch (error) {
          case VerifyMagicCodeError.Invalid: {
            return returnFormError(form.data, {
              otp: {
                message: 'Invalid code. Please check the code and try again.',
              },
            });
          }

          case VerifyMagicCodeError.Expired: {
            return redirect(
              withSearchParams(
                href('/signin'), {
                  [SearchParamAuth.IsExpired]: 'true',
                },
              ),
            );
          }

          default: {
            const exhaustiveCheck: never = error;
            throw new Error('Unhandled error case: ' + exhaustiveCheck);
          }
        }
      }

      const userAgent = request.headers.get('user-agent') ?? undefined;
      const sessionCookie = await createSessionCookie(
        result.otp.userId,
        userAgent,
      );

      return redirect(
        href('/onboarding'),
        {
          headers: {
            'Set-Cookie': sessionCookie,
          },
        },
      );
    }

    case 'resend': {
      const [error, result] = await initMagicCode(email);
      if (error !== null) {
        return;
      }

      return redirect(
        withSearchParams(
          href('/otp/:otpId', { otpId: result.otp.id }),
          { [SearchParamAuth.Email]: email },
        ),
      );
    }
  }
}

export default function Otp({ loaderData }: Route.ComponentProps) {
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

  return (
    <>
      <ControlledForm form={formVerify}>
        <title>Verify Magic Code</title>
        <formVerify.AppField name="action">
          {field => <field.HiddenInput />}
        </formVerify.AppField>
        <Typography variant="heading2" textColorLight="black" textColorDark="white" className="mb-3 text-center">
          One-Time
          <br />
          Verification Code
        </Typography>
        <Typography
          variant="bodySmall"
          textColorLight="grey-900"
          textColorDark="white"
          className="text-center"
        >
          We sent a code to:
        </Typography>
        <Typography
          variant="bodySmall"
          textColorLight="grey-900"
          textColorDark="white"
          className="mb-6 text-center"
          fontWeight="semibold"
        >
          {loaderData.email}
          {' '}
          (
          <Link
            as={ReactRouterLink}
            variant="bodySmall"
            to={
              withSearchParams(
                href('/signin'),
                {
                  [SearchParamAuth.Email]: loaderData.email,
                },
              )
            }
          >
            edit
          </Link>
          )
        </Typography>
        <formVerify.AppField name="otp">
          {field => (
            <field.OneTimePasswordField
              label="One-Time Password"
              hint="Check your inbox for the code. Booja!"
              className="mb-6"
            />
          )}
        </formVerify.AppField>

        <formVerify.SubmitButton
          colorLight="primary"
          colorDark="upgrade"
          className="mb-4 w-full"
        >
          {commonCopies.actions.continue}
        </formVerify.SubmitButton>
      </ControlledForm>
      <ControlledForm form={formResend}>
        <formResend.AppField name="action">
          {field => <field.HiddenInput />}
        </formResend.AppField>
        <formResend.SubmitButton
          colorLight="secondary"
          colorDark="secondary"
          className="mb-10 w-full"
        >
          Resend code
        </formResend.SubmitButton>
      </ControlledForm>
    </>
  );
}
