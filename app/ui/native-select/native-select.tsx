import classNames from 'classnames';
import type { SelectHTMLAttributes } from 'react';
import { FormFieldStyle } from '../form-field-style/form-field-style';
import { Icon } from '../icon/icon';
import { Label } from '../label/label';
import { Typography } from '../typography/typography';

export type NativeSelectItem<Value extends string> = {
  value: Value;
  label: string;
};

export interface NativeSelectProps<Value extends string>
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'className' | 'value' | 'onChange'
  > {
  id: string;
  label?: string;
  items: NativeSelectItem<Value>[];
  value?: Value;
  onValueChange?: (value: Value) => void;
  /** Shown, and not choosable, until an item is picked. */
  placeholder?: string;
  errorMessage?: string;
  className?: string;
}

/**
 * A form field that opens the browser's own picker, which on a phone is
 * the system wheel or sheet. Looks like `TextField`; reach for `Select`
 * for a compact chooser inside a row.
 */
export const NativeSelect = <Value extends string>({
  id,
  label,
  items,
  value,
  onValueChange,
  placeholder,
  errorMessage,
  disabled,
  className,
  ...props
}: NativeSelectProps<Value>) => {
  return (
    <div className={classNames('flex flex-col gap-2', className)}>
      {label && (
        <Label htmlFor={id} disabled={disabled}>
          {label}
        </Label>
      )}
      <div className="relative">
        <FormFieldStyle
          as="select"
          id={id}
          value={value ?? ''}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onValueChange?.(event.target.value as Value)}
          disabled={disabled}
          aria-invalid={!!errorMessage}
          aria-errormessage={errorMessage ? `${id}-error` : undefined}
          className={classNames(
            'w-full cursor-pointer appearance-none pr-10',
            !value && 'text-pca-grey-400! dark:text-pca-grey-500!',
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {items.map(item => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </FormFieldStyle>
        <Icon
          icon="chevronDown"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-pca-grey-500"
        />
      </div>
      {errorMessage && (
        <Typography
          id={`${id}-error`}
          as="span"
          variant="bodyTiny"
          textColorLight="red-500"
          textColorDark="red-500"
        >
          {errorMessage}
        </Typography>
      )}
    </div>
  );
};
