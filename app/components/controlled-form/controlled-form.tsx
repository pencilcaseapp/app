import type { AnyFormApi } from '@tanstack/react-form';
import { useId, type ReactNode } from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';

export type ControlledFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: AnyFormApi & { AppForm: any };
  /** Own id, for a submit button rendered outside the form element. */
  id?: string;
  children: ReactNode;
};

export const ControlledForm: React.FC<ControlledFormProps>
  = ({ form, id, children }) => {
    const generatedId = useId();
    const formId = id ?? generatedId;
    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit({ formId });
    };

    return (
      <Form id={formId} method="post" onSubmit={handleSubmit} className="block">
        <form.AppForm>
          <AuthenticityTokenInput />
          {children}
        </form.AppForm>
      </Form>
    );
  };
