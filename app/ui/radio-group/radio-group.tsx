import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import classNames from 'classnames';
import { useId, type ReactNode } from 'react';
import { Typography } from '../typography/typography';

export type RadioGroupItem<Value extends string> = {
  value: Value;
  label: string;
};

export type RadioGroupProps<Value extends string> = {
  /** Submits the chosen value with the surrounding form. */
  name?: string;
  label: string;
  items: RadioGroupItem<Value>[];
  value?: Value;
  onValueChange?: (value: Value) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * One choice out of a short list that stays in view, one row each. Reach
 * for `Select` when the list is long or the choice sits inside a row.
 * Base UI renders a hidden input under `name`, so the value reaches the
 * action through `FormData`.
 */
export const RadioGroup = <Value extends string>({
  name,
  label,
  items,
  value,
  onValueChange,
  disabled,
  className,
}: RadioGroupProps<Value>): ReactNode => {
  const labelId = useId();

  return (
    <div className={classNames('flex flex-col gap-2', className)}>
      <Typography
        id={labelId}
        as="span"
        variant="bodySmall"
        fontWeight="semibold"
        textColorLight={disabled ? 'grey-300' : 'grey-900'}
        textColorDark={disabled ? 'grey-800' : 'grey-300'}
      >
        {label}
      </Typography>
      <BaseRadioGroup
        name={name}
        value={value}
        onValueChange={next => onValueChange?.(next as Value)}
        disabled={disabled}
        aria-labelledby={labelId}
        className="flex flex-col"
      >
        {items.map(item => (
          <label
            key={item.value}
            className="flex cursor-pointer select-none items-center gap-3 rounded-xl px-2 py-2 text-sm text-pca-grey-900 transition-colors duration-150 hover:bg-pca-grey-100 dark:text-pca-white dark:hover:bg-pca-grey-800"
          >
            <Radio.Root
              value={item.value}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-pca-grey-400 outline-0 ring-pca-blue-300 transition-colors duration-150 focus-visible:ring-2 data-checked:border-pca-grey-900 data-checked:bg-pca-grey-900 dark:border-pca-grey-600 dark:data-checked:border-pca-white dark:data-checked:bg-pca-white"
            >
              <Radio.Indicator className="h-2 w-2 rounded-full bg-pca-white dark:bg-pca-grey-900" />
            </Radio.Root>
            {item.label}
          </label>
        ))}
      </BaseRadioGroup>
    </div>
  );
};
