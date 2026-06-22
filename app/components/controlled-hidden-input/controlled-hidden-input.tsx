import { useFieldContext } from '~/contexts/form';

export type ControlledHiddenInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'id' | 'name' | 'value'>;

export const ControlledHiddenInput: React.FC<ControlledHiddenInputProps>
  = (props) => {
    const field = useFieldContext<string>();

    return (
      <input
        type="hidden"
        id={field.name}
        name={field.name}
        value={field.state.value}
        {...props}
      />
    );
  };
