import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import z from 'zod';
import { formHook } from '~/hooks/use-app-form';
import { userEvent } from '@testing-library/user-event';

const schema = z.object({
  sharing: z.boolean().refine(value => value, {
    message: 'Link sharing must be enabled',
  }),
});

const TestForm: React.FC<{ defaultValue?: boolean }> = ({
  defaultValue = false,
}) => {
  const form = formHook.useAppForm({
    defaultValues: {
      sharing: defaultValue,
    },
    validators: {
      onBlur: schema,
    },
  });

  return (
    <form.AppForm>
      <form.AppField name="sharing">
        {field => (
          <field.Switch label="Link sharing" />
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

  const element = getByRole('switch');

  await userEvent.click(element);
  expect(element).toBeChecked();

  await userEvent.click(element);
  expect(element).not.toBeChecked();
});

test('renders the value held by the form', () => {
  const { getByRole } = render(
    <TestForm defaultValue />,
  );

  expect(getByRole('switch')).toBeChecked();
});

test('derives the field name from the form', () => {
  const { container, getByRole } = render(
    <TestForm />,
  );

  expect(getByRole('switch', { name: 'Link sharing' })).toBeInTheDocument();

  // The hidden input is what actually carries the value on submit.
  const input = container.querySelector('input[type="checkbox"]');

  expect(input).toHaveAttribute('name', 'sharing');
  expect(input).toHaveAttribute('id', 'sharing');
});

test('error message', async () => {
  const { getByRole, getByText } = render(
    <TestForm defaultValue />,
  );

  await userEvent.click(getByRole('switch'));
  await userEvent.tab();

  expect(getByText('Link sharing must be enabled')).toBeInTheDocument();
  expect(getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
});
