import type { AnyFormApi } from '@tanstack/react-form';
import { useIsClient } from '@uidotdev/usehooks';
import type { ReactNode } from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { getFormId } from '~/contexts/form';

export type ControlledFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: AnyFormApi & { AppForm: any };
  children: ReactNode;
  noValidate?: boolean;
};

export const ControlledForm: React.FC<ControlledFormProps>
  = ({ form, children, noValidate }) => {
    // Hydration resets the fields, which would throw away whatever was
    // typed or autofilled into the server-rendered form.
    const isHydrated = useIsClient();

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
    };

    return (
      <Form
        id={getFormId(form)}
        method="post"
        onSubmit={handleSubmit}
        noValidate={noValidate}
        className="block"
      >
        <form.AppForm>
          <AuthenticityTokenInput />
          <fieldset disabled={!isHydrated} className="contents">
            {children}
          </fieldset>
        </form.AppForm>
      </Form>
    );
  };
