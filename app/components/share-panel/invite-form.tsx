import { useEffect, useRef, type FC } from 'react';
import { useActionData } from 'react-router';
import { z } from 'zod';
import { ControlledForm } from '~/components/controlled-form/controlled-form';
import { ControlledSubmitButton } from '~/components/controlled-submit-button/controlled-submit-button';
import {
  DEFAULT_DOCUMENT_INVITE_ACCESS,
  DOCUMENT_ACCESS,
  documentInviteCopies,
  type DocumentAccess,
} from '~/constants/document';
import { useAppForm } from '~/hooks/use-app-form';
import { useEmitToast } from '~/hooks/use-toast';

export const inviteFormSchema = z.object({
  email: z.email(documentInviteCopies.invalidEmail),
  access: z.enum(DOCUMENT_ACCESS),
});

/** What the document action answers once an invite went out. */
export interface InviteFormResult {
  ok: true;
  invited: { email: string };
}

const ACCESS_ITEMS: { value: DocumentAccess; label: string }[] = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

/*
 * The address to invite with the access inside the field, and the button
 * that sends it. Posts to the document route, whose action answers with the
 * form state on a failure and with the invited address on success. The
 * panel lets go of the form when it closes while the action data outlives
 * that, so the form starts over on reopening and only a result that
 * arrives while it is open counts as one.
 */
export const InviteForm: FC = () => {
  const actionData = useActionData() as InviteFormResult | undefined;
  const mountActionDataRef = useRef(actionData);
  const emitToast = useEmitToast();
  const form = useAppForm({
    defaultValues: {
      email: '',
      access: DEFAULT_DOCUMENT_INVITE_ACCESS as DocumentAccess,
    },
    validators: {
      onBlur: inviteFormSchema,
    },
  }, { freshOnMount: true });

  useEffect(() => {
    if (!actionData?.ok || actionData === mountActionDataRef.current) {
      return;
    }

    form.resetField('email');
    emitToast({
      type: 'success',
      title: `Invite sent to ${actionData.invited.email}`,
    });
  }, [actionData, form, emitToast]);

  return (
    <ControlledForm form={form}>
      <div className="flex items-start gap-2">
        <form.AppField name="email">
          {field => (
            <field.TextField
              type="email"
              aria-label="Email address"
              placeholder="name@mail.com"
              // The address is somebody else's, so neither the browser
              // nor a password manager should offer the owner's own.
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              className="min-w-0 flex-1"
              trailing={(
                <form.AppField name="access">
                  {accessField => (
                    <accessField.Select
                      aria-label="Access for the invited person"
                      items={ACCESS_ITEMS}
                      variant="solid"
                    />
                  )}
                </form.AppField>
              )}
            />
          )}
        </form.AppField>
        <ControlledSubmitButton className="shrink-0 lg:h-11">
          Invite
        </ControlledSubmitButton>
      </div>
    </ControlledForm>
  );
};
