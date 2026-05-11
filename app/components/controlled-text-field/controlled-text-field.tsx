import { useFieldContext } from '~/contexts/form';
import { TextField, type TextFieldProps } from '~/ui/text-field/text-field';

export type ControlledTextFieldProps = Omit<TextFieldProps, 'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'errorMessage'>;

export const ControlledTextField: React.FC<ControlledTextFieldProps>
  = (props) => {
    const field = useFieldContext<string>();

    return (
      <TextField
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        errorMessage={field.state.meta.errors[0]?.message}
        {...props}
      />
    );
  };
