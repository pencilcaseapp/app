import { render } from '@testing-library/react';
import { act } from 'react';
import { expect, test } from 'vitest';
import z from 'zod';
import { formHook } from '~/hooks/use-app-form';

const schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const TestForm: React.FC = () => {
  const form = formHook.useAppForm({
    defaultValues: {
      otp: '',
    },
    validators: {
      onBlur: schema,
    },
  });

  return (
    <form.AppForm>
      <form.AppField name="otp">
        {field => (
          <field.OneTimePasswordField label="OTP" hint="Enter the 6-digit code" />
        )}
      </form.AppField>
      <form.SubmitButton>
        Submit
      </form.SubmitButton>
    </form.AppForm>
  );
};

test('matches snapshot', async () => {
  const { container } = render(
    <TestForm />,
  );

  await act(() => new Promise(resolve => setTimeout(resolve)));

  expect(container).toMatchSnapshot();
});
