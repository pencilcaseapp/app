import type { AnyFormApi } from '@tanstack/react-form';
import { useId, type ReactNode } from 'react';
import { Form } from 'react-router';

export type ControlledFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: AnyFormApi & { AppForm: any };
  children: ReactNode;
};

export const ControlledForm: React.FC<ControlledFormProps>
  = ({ form, children }) => {
    const formId = useId();
    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit({ formId });
    };

    return (
      <Form id={formId} method="post" onSubmit={handleSubmit}>
        <form.AppForm>
          {children}
        </form.AppForm>
      </Form>
    );
  };
