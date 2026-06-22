import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import z from 'zod';
import { formHook } from '~/hooks/use-app-form';
import { userEvent } from '@testing-library/user-event';

const schema = z.object({
  accept: z.boolean(),
});

const TestForm: React.FC = () => {
  const form = formHook.useAppForm({
    defaultValues: {
      accept: false,
    },
    validators: {
      onBlur: schema,
    },
  });

  return (
    <form.AppForm>
      <form.AppField name="accept">
        {field => (
          <field.Checkbox label="Accept" />
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

test('handles state changes', async () => {
  const { getByRole } = render(
    <TestForm />,
  );

  const checkbox = getByRole('checkbox');

  await userEvent.click(checkbox);
  expect(checkbox).toBeChecked();

  await userEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
});
