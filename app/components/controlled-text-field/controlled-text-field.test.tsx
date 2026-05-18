import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import z from 'zod';
import { formHook } from '~/hooks/use-app-form';
import { userEvent } from '@testing-library/user-event';

const schema = z.object({
  email: z.email(),
});

const TestForm: React.FC = () => {
  const form = formHook.useAppForm({
    defaultValues: {
      email: 'john.doe@example.com',
    },
    validators: {
      onBlur: schema,
    },
  });

  return (
    <form.AppForm>
      <form.AppField name="email">
        {field => (
          <field.TextField label="Email" />
        )}
      </form.AppField>
    </form.AppForm>
  );
};

test('matches snapshot', () => {
  const { container } = render(
    <TestForm />,
  );

  expect(container).toMatchSnapshot();
});

test('error message', async () => {
  const { getByLabelText, getByText } = render(
    <TestForm />,
  );

  await userEvent.type(getByLabelText('Email'), 'invalid-email');
  await userEvent.tab();

  expect(getByText('Invalid email address')).toBeInTheDocument();
});
