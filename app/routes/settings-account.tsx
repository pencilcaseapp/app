import { useEffect } from 'react';
import { useActionData, useOutletContext } from 'react-router';
import { z } from 'zod';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { ControlledSubmitButton } from '~/components/controlled-submit-button/controlled-submit-button';
import { SettingsDialogContent } from '~/components/settings-dialog/settings-dialog';
import type { SettingsOutletContext } from '~/components/settings-dialog/settings-dialog';
import { SettingsProfile } from '~/components/settings-dialog/settings-profile';
import { userSessionContext } from '~/contexts/user-session';
import { useAppForm } from '~/hooks/use-app-form';
import { useEmitToast } from '~/hooks/use-toast';
import { updateUser } from '~/repos/user';
import { Button } from '~/ui/button/button';
import { Icon } from '~/ui/icon/icon';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { ResponsiveDialogClose } from '~/ui/responsive-dialog/responsive-dialog';
import { Typography } from '~/ui/typography/typography';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/settings-account';

// The save button sits in the dialog footer, outside the form element,
// and is wired to the form by this id.
const FORM_ID = 'settings-account-form';

const formSchema = z.object({
  name: z.string().optional(),
  newsletter: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export async function action({ request, context }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);

  if (!form.ok) {
    return form.formState;
  }

  await updateUser(user.id, {
    name: form.data.name,
    newsletter: form.data.newsletter,
  });

  return { saved: true };
}

const chevron = (
  <Icon icon="chevronRight" className="m-1 text-pca-grey-400" />
);

/*
 * The account section: the name and the newsletter preference are saved
 * through the footer's save button, the e-mail is not editable yet.
 */
export default function SettingsAccountRoute() {
  const { user } = useOutletContext<SettingsOutletContext>();
  const actionData = useActionData() as { saved?: boolean } | undefined;
  const emitToast = useEmitToast();

  const form = useAppForm({
    defaultValues: {
      name: user.name ?? '',
      newsletter: user.newsletter ?? false,
    } as FormValues,
    validators: {
      onSubmit: formSchema,
    },
  });

  useEffect(() => {
    if (actionData?.saved) {
      emitToast({ type: 'success', title: 'Your account has been updated.' });
    }
  }, [actionData, emitToast]);

  return (
    <SettingsDialogContent
      section="account"
      footerArea={(
        // The footer renders outside the form element and its provider:
        // `form.AppForm` restores the context, the id the association.
        <form.AppForm>
          <div className="flex items-center justify-end gap-2">
            <ResponsiveDialogClose
              render={<Button colorLight="secondary">Cancel</Button>}
            />
            <ControlledSubmitButton form={FORM_ID}>
              Save
            </ControlledSubmitButton>
          </div>
        </form.AppForm>
      )}
    >
      <ControlledForm form={form} id={FORM_ID}>
        <div className="flex flex-col gap-6">
          <SettingsProfile user={user} />
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                autoComplete="name"
                placeholder="e.g. John Doe"
              />
            )}
          </form.AppField>
          <div className="flex flex-col gap-1">
            <Typography variant="bodySmall" fontWeight="semibold" as="h3">
              Change e-mail
            </Typography>
            <NavigationItem
              as="button"
              type="button"
              icon="mail"
              title={user.email}
              actionArea={chevron}
              isActionAreaVisible
            />
          </div>
          <div className="flex flex-col gap-1">
            <Typography variant="bodySmall" fontWeight="semibold" as="h3">
              Newsletter
            </Typography>
            <Typography
              variant="bodyTiny"
              textColorLight="grey-600"
              textColorDark="grey-400"
            >
              We’ll send you important feature updates and special offers.
              No spam, no scam, we hate it too. Unsubscribe at any time.
            </Typography>
            <form.AppField name="newsletter">
              {field => (
                <field.Checkbox
                  label="Subscribe to Newsletter"
                  className="mt-3"
                />
              )}
            </form.AppField>
          </div>
        </div>
      </ControlledForm>
    </SettingsDialogContent>
  );
}
