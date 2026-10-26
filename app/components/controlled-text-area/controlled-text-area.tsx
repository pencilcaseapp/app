import { useFieldContext } from '~/contexts/form';
import { TextArea, type TextAreaProps } from '~/ui/text-area/text-area';

export type ControlledTextAreaProps = Omit<
  TextAreaProps,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'errorMessage'
>;

export const ControlledTextArea: React.FC<ControlledTextAreaProps> = (
  props,
) => {
  const field = useFieldContext<string>();

  return (
    <TextArea
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
