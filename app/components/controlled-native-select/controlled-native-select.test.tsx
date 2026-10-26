import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test } from 'vitest';
import z from 'zod';
import { formHook } from '~/hooks/use-app-form';

const schema = z.object({
  reason: z.enum(['spam', 'other'], { error: 'Pick one' }),
});

const TestForm: React.FC = () => {
  const form = formHook.useAppForm({
    defaultValues: { reason: '' as 'spam' | 'other' },
    validators: { onSubmit: schema },
  });

  return (
    <form.AppForm>
      <form.AppField name="reason">
        {field => (
          <field.NativeSelect
            label="Reason"
            placeholder="Choose"
            items={[
              { value: 'spam', label: 'Spam' },
              { value: 'other', label: 'Other' },
            ]}
          />
        )}
      </form.AppField>
      <button type="button" onClick={() => form.handleSubmit()}>Send</button>
    </form.AppForm>
  );
};

test('shows the schema error on the select', async () => {
  const { getByLabelText, getByRole, findByText } = render(<TestForm />);

  await userEvent.click(getByRole('button', { name: 'Send' }));

  expect(await findByText('Pick one')).toBeInTheDocument();
  expect(getByLabelText('Reason')).toHaveAttribute('aria-invalid', 'true');
});
