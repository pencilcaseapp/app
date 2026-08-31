import { getFormId, useFormContext } from '~/contexts/form';
import { Button, type ButtonProps } from '~/ui/button/button';

export type ControlledSubmitButtonProps = Omit<ButtonProps<'button'>, 'type' | 'disabled' | 'isLoading' | 'form'>;

export const ControlledSubmitButton: React.FC<ControlledSubmitButtonProps>
  = (props) => {
    const form = useFormContext();

    return (
      <form.Subscribe
        selector={formState => formState.isSubmitting}
      >
        {isSubmitting => (
          <Button
            type="submit"
            // Submits the form of its context, which is the enclosing one
            // unless the button is rendered outside of it.
            form={getFormId(form)}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            aria-label={isSubmitting ? 'Submitting' : undefined}
            {...props}
          />
        )}
      </form.Subscribe>
    );
  };
