import { Typography } from '~/ui/typography/typography';
import { Link } from '~/ui/link/link';
import type { Route } from './+types/signin';
import { z } from 'zod';
import { useAppForm } from '~/hooks/use-app-form';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { validateForm } from '~/utils/form';
import { href, redirect } from 'react-router';

const formSchema = z.object({
  email: z.email(),
});

export async function action({ request }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    return form.formState;
  }

  return redirect(href('/home'));
}

export default function SignIn() {
  const form = useAppForm({
    defaultValues: {
      email: '',
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
      <Typography variant="bodySmall" textColorLight="grey-900" textColorDark="white" className="mb-6 text-center">
        Please enter your e-mail address.
        <br />
        We’ll handle the magic (link) for you …
      </Typography>
      <form.AppField name="email">
        {field => (
          <field.TextField
            type="email"
            placeholder="e.g. your@example.com"
            label="E-Mail"
            className="mb-6"
          />
        )}
      </form.AppField>

      <form.SubmitButton
        colorLight="primary"
        colorDark="upgrade"
        className="mb-10 w-full"
      >
        Continue
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
