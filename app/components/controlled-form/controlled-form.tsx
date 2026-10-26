import type { AnyFormApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { getFormId } from '~/contexts/form';
import { useIsHydrated } from '~/hooks/use-is-hydrated';

export type ControlledFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: AnyFormApi & { AppForm: any };
  children: ReactNode;
  noValidate?: boolean;
  /** Where it posts; the current route's action when left out. */
  action?: string;
};

export const ControlledForm: React.FC<ControlledFormProps>
  = ({ form, children, noValidate, action }) => {
    // Hydration resets the fields, which would throw away whatever was
    // typed or autofilled into the server-rendered form. A form mounted by a
    // client-side navigation has nothing to lose and is enabled at once.
    const isHydrated = useIsHydrated();

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
    };

    return (
      <Form
        id={getFormId(form)}
        method="post"
        action={action}
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
