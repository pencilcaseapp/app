import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import type { Route } from './+types/onboarding';
import { Typography } from '~/ui/typography/typography';
import { z } from 'zod';
import { useAppForm } from '~/hooks/use-app-form';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { commonCopies } from '~/constants/common-copies';
import { validateForm } from '~/utils/form';
import { onboardUser } from '~/services/auth';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({
  name: z.string().optional(),
  newsletter: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);

  if (user.onboarded) {
    return redirect(href('/home'));
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);

  if (!form.ok) {
    return form.formState;
  }

  await onboardUser(user.id, form.data);

  return redirect(href('/home'));
}

export default function Onboarding() {
  const formOnboarding = useAppForm({
    defaultValues: {
      name: '',
      newsletter: false,
    } as FormValues,
    validators: {
      onSubmit: formSchema,
    },
  });

  const formSkip = useAppForm({
    defaultValues: {
      name: '',
      newsletter: false,
    } as FormValues,
    validators: {
      onSubmit: formSchema,
    },
  });

  return (
    <>
      <title>Onboarding</title>
      <ControlledForm form={formOnboarding}>
        <picture role="presentation" className="block w-45 h-45 ml-auto mr-auto mb-6">
          <source srcSet="welcoming-pencil-dark.svg" media="(prefers-color-scheme: dark)" />
          <img src="welcoming-pencil-light.svg" />
        </picture>
        <Typography
          variant="heading2"
          textColorLight="black"
          textColorDark="white"
          className="text-center mb-3"
        >
          Congrats. Welcome!
        </Typography>
        <Typography
          variant="bodySmall"
          textColorLight="grey-900"
          textColorDark="white"
          className="text-center mb-6"
        >
          You've successfully signed up! Feel free to
          provide us an optional name for your account.
          This will be used to personalize your experience.
        </Typography>
        <formOnboarding.AppField name="name">
          {field => (
            <field.TextField
              type="text"
              placeholder="e.g. John Doe"
              label="Name"
              className="mb-5"
            />
          )}
        </formOnboarding.AppField>
        <formOnboarding.AppField name="newsletter">
          {field => (
            <field.Checkbox
              label="I want to receive emails about product updates, new features and offers."
              className="mb-6"
            />
          )}
        </formOnboarding.AppField>
        <formOnboarding.SubmitButton
          colorLight="primary"
          colorDark="upgrade"
          className="mb-4 w-full"
        >
          {commonCopies.actions.continue}
        </formOnboarding.SubmitButton>
      </ControlledForm>
      <ControlledForm form={formSkip}>
        <formSkip.SubmitButton
          colorLight="secondary"
          colorDark="secondary"
          className="mb-10 w-full"
        >
          Skip it
        </formSkip.SubmitButton>
      </ControlledForm>
    </>
  );
}
