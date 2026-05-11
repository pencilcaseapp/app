import { useFormContext } from '~/contexts/form';
import { Button, type ButtonProps } from '~/ui/button/button';

export type ControlledSubmitButtonProps = Omit<ButtonProps<'button'>, 'type' | 'disabled' | 'isLoading'>;

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
            disabled={isSubmitting}
            isLoading={isSubmitting}
            {...props}
          />
        )}
      </form.Subscribe>
    );
  };
