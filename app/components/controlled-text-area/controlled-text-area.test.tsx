import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test } from 'vitest';
import z from 'zod';
import { formHook } from '~/hooks/use-app-form';

const schema = z.object({
  details: z.string().max(3, 'Too long'),
});

const TestForm: React.FC = () => {
  const form = formHook.useAppForm({
    defaultValues: { details: '' },
    validators: { onBlur: schema },
  });

  return (
    <form.AppForm>
      <form.AppField name="details">
        {field => <field.TextArea label="Details" />}
      </form.AppField>
    </form.AppForm>
  );
};

test('keeps the typed text in the field', async () => {
  const { getByLabelText } = render(<TestForm />);

  await userEvent.type(getByLabelText('Details'), 'Hi');

  expect(getByLabelText('Details')).toHaveValue('Hi');
});

test('shows the schema error under the field', async () => {
  const { getByLabelText, getByText } = render(<TestForm />);

  await userEvent.type(getByLabelText('Details'), 'Hello');
  await userEvent.tab();

  expect(getByText('Too long')).toBeInTheDocument();
  expect(getByLabelText('Details')).toHaveAttribute('aria-invalid', 'true');
});
