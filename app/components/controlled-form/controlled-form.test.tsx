import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import z from 'zod';
import { useAppForm } from '~/hooks/use-app-form';
import { userEvent } from '@testing-library/user-event';
import { ControlledForm } from './controlled-form';
import { createRoutesStub, useActionData } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';

const schema = z.object({
  email: z.email(),
});

test('submits the form successfully', async () => {
  const Stub = createRoutesStub([
    {
      path: '/',
      action: async () => ({ ok: true }),
      Component: () => {
        const actionData = useActionData();
        const form = useAppForm({
          defaultValues: {
            email: '',
          },
          validators: {
            onBlur: schema,
          },
        });

        return (
          <AuthenticityTokenProvider token="test-token">
            <ControlledForm form={form}>
              <form.AppField name="email">
                {field => (
                  <field.TextField label="Email" />
                )}
              </form.AppField>
              <button type="submit">Submit</button>
              {actionData?.ok === true && (
                <div>Form submitted successfully</div>
              )}
            </ControlledForm>
          </AuthenticityTokenProvider>
        );
      },
    },
  ]);

  const { getByLabelText, getByText } = render(
    <Stub />,
  );

  await userEvent.type(getByLabelText('Email'), 'john.doe@example.com');
  await userEvent.click(getByText('Submit'));

  expect(getByText('Form submitted successfully')).toBeInTheDocument();
});

test('shows error message on submit', async () => {
  const Stub = createRoutesStub([
    {
      path: '/',
      action: async () => ({ ok: true }),
      Component: () => {
        const actionData = useActionData();
        const form = useAppForm({
          defaultValues: {
            email: '',
          },
          validators: {
            onBlur: schema,
          },
        });

        return (
          <AuthenticityTokenProvider token="test-token">
            <ControlledForm form={form}>
              <form.AppField name="email">
                {field => (
                  <field.TextField label="Email" />
                )}
              </form.AppField>
              <button type="submit">Submit</button>
              {actionData?.ok === true && (
                <div>Form submitted successfully</div>
              )}
            </ControlledForm>
          </AuthenticityTokenProvider>
        );
      },
    },
  ]);

  const { getByLabelText, getByText } = render(
    <Stub />,
  );

  await userEvent.type(getByLabelText('Email'), 'invalid-email');
  await userEvent.click(getByText('Submit'));

  expect(getByText('Invalid email address')).toBeInTheDocument();
});
