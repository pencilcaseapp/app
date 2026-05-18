import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { formHook } from '~/hooks/use-app-form';
import { ControlledSubmitButton } from './controlled-submit-button';
import { userEvent } from '@testing-library/user-event';

const TestForm: React.FC = () => {
  const form = formHook.useAppForm({
    async onSubmit() {
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  });

  return (
    <form.AppForm>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <ControlledSubmitButton>
          Submit
        </ControlledSubmitButton>
      </form>
    </form.AppForm>
  );
};

describe('ControlledSubmitButton', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <TestForm />,
    );

    expect(container).toMatchSnapshot();
  });

  test('is disabled and shows loading state when submitting', async () => {
    const { getByRole } = render(
      <TestForm />,
    );

    const button = getByRole('button', { name: 'Submit' });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Submitting');
    expect(getByRole('status', { name: 'loading' })).toBeInTheDocument();
  });
});
