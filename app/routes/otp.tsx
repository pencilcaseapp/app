import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { useAppForm } from '~/hooks/use-app-form';
import { z } from 'zod';
import { Typography } from '~/ui/typography/typography';
import { commonCopies } from '~/constants/common-copies';
import type { Route } from './+types/otp';
import { returnFormError, validateForm } from '~/utils/form';
import { createSessionCookie, verifyMagicCode } from '~/services/auth';
import { href, redirect, Link as ReactRouterLink } from 'react-router';
import { SearchParamAuth } from '~/constants/search-params';
import { getRequiredSearchParam, withSearchParams } from '~/utils/url';
import { Link } from '~/ui/link/link';
import { getValidOtp } from '~/repos/otp';

const formSchema = z.object({
  otp: z.string(),
});

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

  const [error, result] = await verifyMagicCode(otpId, email, form.data.otp);
  if (error !== null) {
    return returnFormError(form.data, {
      otp: {
        message: 'Invalid code. Please check the code and try again.',
      },
    });
  }

  const sessionCookie = await createSessionCookie(result.otp.userId);

  return redirect(
    href('/onboarding'),
    {
      headers: {
        'Set-Cookie': sessionCookie,
      },
    },
  );
}

export default function Otp({ loaderData }: Route.ComponentProps) {
  const form = useAppForm({
    defaultValues: {
      otp: '',
    },
    validators: {
      onBlur: formSchema,
    },
  });

  return (
    <ControlledForm form={form}>
      <title>Verify Magic Code</title>
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
        We sent you an verification code to:
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
      <form.AppField name="otp">
        {field => (
          <field.TextField
            type="text"
            placeholder="Enter your OTP"
            label="One-Time Password"
            className="mb-6"
          />
        )}
      </form.AppField>

      <form.SubmitButton
        colorLight="primary"
        colorDark="upgrade"
        className="mb-10 w-full"
      >
        {commonCopies.actions.continue}
      </form.SubmitButton>
    </ControlledForm>
  );
}
