import type { AnyFormApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { Form } from 'react-router';

type ControlledFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: AnyFormApi & { AppForm: any };
  children: ReactNode;
};

export function ControlledForm({ form, children }: ControlledFormProps) {
  return (
    <Form method="post" onSubmit={form.handleSubmit}>
      <form.AppForm>{children}</form.AppForm>
    </Form>
  );
}
