import { useFieldContext } from '~/contexts/form';
import { OneTimePasswordField, type OneTimePasswordFieldProps } from '~/ui/one-time-password-field/one-time-password-field';

export type ControlledOneTimePasswordFieldProps = Omit<OneTimePasswordFieldProps, 'onValueChange' | 'value' | 'onAutoSubmit' | 'errorMessage' | 'name'>;

// eslint-disable-next-line @stylistic/max-len
export const ControlledOneTimePasswordField: React.FC<ControlledOneTimePasswordFieldProps>
  = (props) => {
    const field = useFieldContext<string>();

    return (
      <OneTimePasswordField
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        errorMessage={field.state.meta.errors[0]?.message}
        {...props}
      />
    );
  };
