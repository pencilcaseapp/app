import { Typography } from '~/ui/typography/typography';
import { Link } from '~/ui/link/link';
import type { Route } from './+types/signin';
import { z } from 'zod';
import { useAppForm } from '~/hooks/use-app-form';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { returnFormError, validateForm } from '~/utils/form';
import { href, redirect } from 'react-router';
import { commonCopies } from '~/constants/common-copies';
import { initMagicCode } from '~/services/auth';
import { getOptionalSearchParam, withSearchParams } from '~/utils/url';
import { SearchParamAuth } from '~/constants/search-params';
import { Notification } from '~/ui/notification/notification';

const formSchema = z.object({
  email: z.email(),
});

export function loader({ request }: Route.ActionArgs) {
  const email = getOptionalSearchParam(request, SearchParamAuth.Email);
  const isExpired = getOptionalSearchParam<boolean>(
    request, SearchParamAuth.IsExpired,
  );

  return {
    email,
    isExpired,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    return form.formState;
  }

  const [error, result] = await initMagicCode(form.data.email);
  if (error !== null) {
    return returnFormError(form.data, {
      email: {
        message: 'Too many requests. Please try again later.',
      },
    });
  }

  return redirect(
    withSearchParams(
      href('/otp/:otpId', { otpId: result.otp.id }),
      { [SearchParamAuth.Email]: form.data.email },
    ),
  );
}

export default function SignIn({ loaderData }: Route.ComponentProps) {
  const form = useAppForm({
    defaultValues: {
      email: loaderData.email ?? '',
    },
    validators: {
      onBlur: formSchema,
    },
  });

  return (
    <ControlledForm form={form}>
      <title>Sign In or Sign Up</title>
      <Typography variant="heading2" textColorLight="black" textColorDark="white" className="mb-3 text-center">
        Sign In or Sign Up
        <br />
        with Magic
      </Typography>
      <Typography variant="bodySmall" textColorLight="grey-900" textColorDark="white" className="mb-6 text-center px-10">
        Enter your e-mail address to receive a one-time verification code.
      </Typography>
      {loaderData.isExpired && (
        <Notification
          variant="warning"
          title="Code has expired. Please try again."
          className="mb-5"
        />
      )}
      <form.AppField name="email">
        {field => (
          <field.TextField
            type="email"
            placeholder="e.g. your@example.com"
            label="E-Mail"
            className="mb-6"
            autoComplete="username"
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

      <Typography variant="bodyTiny" textColorLight="grey-800" textColorDark="grey-300" className="text-center">
        By continuing, you acknowledge that you understand
        and agree to the
        {' '}
        <Link variant="bodyTiny" fontWeight="regular" textColorLight="grey-800" textColorDark="grey-300" href="https://example.com/terms" target="_blank">Terms & Conditions</Link>
        {' '}
        and
        {' '}
        <Link variant="bodyTiny" fontWeight="regular" textColorLight="grey-800" textColorDark="grey-300" href="https://example.com/privacy" target="_blank">Privacy Policy</Link>
        .
      </Typography>
    </ControlledForm>
  );
}
