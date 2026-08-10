import { useFieldContext } from '~/contexts/form';
import { Switch, type SwitchProps } from '~/ui/switch/switch';

export type ControlledSwitchProps = Omit<SwitchProps, 'id' | 'name' | 'checked' | 'onCheckedChange' | 'onBlur' | 'errorMessage'>;

export const ControlledSwitch: React.FC<ControlledSwitchProps>
  = (props) => {
    const field = useFieldContext<boolean>();

    return (
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={checked => field.handleChange(checked)}
        onBlur={field.handleBlur}
        errorMessage={field.state.meta.errors[0]?.message}
        {...props}
      />
    );
  };
