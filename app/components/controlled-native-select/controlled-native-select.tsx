import { useFieldContext } from '~/contexts/form';
import {
  NativeSelect,
  type NativeSelectProps,
} from '~/ui/native-select/native-select';

export type ControlledNativeSelectProps<Value extends string> = Omit<
  NativeSelectProps<Value>,
  'id' | 'name' | 'value' | 'onValueChange' | 'onBlur' | 'errorMessage'
>;

export const ControlledNativeSelect = <Value extends string>(
  props: ControlledNativeSelectProps<Value>,
) => {
  const field = useFieldContext<Value>();

  return (
    <NativeSelect
      id={field.name}
      name={field.name}
      value={field.state.value}
      onValueChange={field.handleChange}
      onBlur={field.handleBlur}
      errorMessage={field.state.meta.errors[0]?.message}
      {...props}
    />
  );
};
