import { useFieldContext } from '~/contexts/form';
import { OneTimePasswordField, type OneTimePasswordFieldProps } from '~/ui/one-time-password-field/one-time-password-field';

export type ControlledOneTimePasswordFieldProps = Omit<OneTimePasswordFieldProps, 'onValueChange' | 'value' | 'onAutoSubmit' | 'errorMessage'>;

// eslint-disable-next-line @stylistic/max-len
export const ControlledOneTimePasswordField: React.FC<ControlledOneTimePasswordFieldProps>
  = (props) => {
    const field = useFieldContext<string>();

    const handleAutoSubmit = () => {
      dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    };

    return (
      <>
        <OneTimePasswordField
          value={field.state.value}
          onValueChange={field.handleChange}
          onAutoSubmit={handleAutoSubmit}
          errorMessage={field.state.meta.errors[0]?.message}
          onBlur={field.handleBlur}
          {...props}
        />
        <input id={field.name} type="hidden" name={field.name} value={field.state.value} />
      </>
    );
  };
