import { useFieldContext } from '~/contexts/form';
import { Select, type SelectProps } from '~/ui/select/select';

export type ControlledSelectProps<Value extends string> = Omit<
  SelectProps<Value>,
  'id' | 'name' | 'value' | 'defaultValue' | 'onValueChange'
>;

/**
 * The select as a form field: the value lives in the field state, and Base
 * UI's hidden input under `name` is what submits it with the form.
 */
export const ControlledSelect = <Value extends string>(
  props: ControlledSelectProps<Value>,
) => {
  const field = useFieldContext<Value>();

  return (
    <Select
      id={field.name}
      name={field.name}
      value={field.state.value}
      onValueChange={field.handleChange}
      {...props}
    />
  );
};
