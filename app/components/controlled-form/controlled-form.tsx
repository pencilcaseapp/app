import type { AnyFormApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { getFormId } from '~/contexts/form';

export type ControlledFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: AnyFormApi & { AppForm: any };
  children: ReactNode;
};

export const ControlledForm: React.FC<ControlledFormProps>
  = ({ form, children }) => {
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
        className="block"
      >
        <form.AppForm>
          <AuthenticityTokenInput />
          {children}
        </form.AppForm>
      </Form>
    );
  };
