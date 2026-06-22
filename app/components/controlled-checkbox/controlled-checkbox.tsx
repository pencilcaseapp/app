import { useFieldContext } from '~/contexts/form';
import { Checkbox, type CheckboxProps } from '~/ui/checkbox/checkbox';

export type ControlledCheckboxProps = Omit<CheckboxProps, 'id' | 'name' | 'checked' | 'onChange' | 'onBlur' | 'errorMessage'>;

export const ControlledCheckbox: React.FC<ControlledCheckboxProps>
  = (props) => {
    const field = useFieldContext<boolean>();

    return (
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onChange={() => field.handleChange(!field.state.value)}
        onBlur={field.handleBlur}
        errorMessage={field.state.meta.errors[0]?.message}
        {...props}
      />
    );
  };
