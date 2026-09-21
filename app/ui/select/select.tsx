import { Select as BaseSelect } from '@base-ui/react/select';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import { Icon } from '../icon/icon';
import { Typography } from '../typography/typography';
import type { MenuSurfaceVariant } from '../menu-surface/menu-surface';
import { menuSurfaceClasses } from '../menu-surface/menu-surface';

export type SelectItem<Value extends string> = {
  value: Value;
  label: string;
};

export type SelectProps<Value extends string>
  = Pick<React.AriaAttributes, 'aria-label'> & {
    id?: string;
    /** Submits the chosen value with the surrounding form. */
    name?: string;
    label?: string;
    items: SelectItem<Value>[];
    value?: Value;
    defaultValue?: Value;
    onValueChange?: (value: Value) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    variant?: MenuSurfaceVariant;
    className?: string;
  };

const itemClasses: Record<MenuSurfaceVariant, string> = {
  glass: 'data-highlighted:bg-pca-grey-300/15 dark:data-highlighted:bg-pca-grey-800/80',
  solid: 'data-highlighted:bg-pca-grey-200 dark:data-highlighted:bg-pca-grey-700',
};

/**
 * A chooser for a value the surrounding form submits later. Reach for the
 * dropdown menu instead when picking an option acts straight away, or when the
 * list also holds commands such as removing access.
 *
 * It looks like the dropdown menu on purpose and takes the same `variant`, but
 * it is a listbox: Base UI renders a hidden input for `name`, so the value
 * reaches the action through `FormData` like any other field.
 */
export const Select = <Value extends string>({
  id,
  name,
  label,
  'aria-label': ariaLabel,
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  required,
  variant = 'glass',
  className,
}: SelectProps<Value>): ReactNode => {
  return (
    <BaseSelect.Root
      id={id}
      name={name}
      items={items}
      value={value}
      defaultValue={defaultValue}
      // Base UI reports `null` for a cleared value. There is no clear
      // affordance here, so the only values the list can produce are its own.
      onValueChange={next => next !== null && onValueChange?.(next)}
      disabled={disabled}
      required={required}
    >
      {label && (
        <BaseSelect.Label
          render={(
            <Typography
              as="span"
              variant="bodyTiny"
              textColorLight="grey-700"
              textColorDark="grey-300"
            />
          )}
        >
          {label}
        </BaseSelect.Label>
      )}
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={classNames(
          'inline-flex h-8 max-w-full shrink-0 cursor-pointer items-center gap-1 rounded-lg pl-2.5 pr-1.5 text-sm font-medium text-pca-grey-700 outline-0 transition-colors duration-150 dark:text-pca-grey-300',
          'hover:bg-pca-grey-200 dark:hover:bg-pca-grey-800 data-popup-open:bg-pca-grey-200 dark:data-popup-open:bg-pca-grey-800',
          'focus-visible:ring-2 ring-pca-blue-300',
          'data-disabled:pointer-events-none data-disabled:opacity-30',
          className,
        )}
      >
        <BaseSelect.Value className="truncate">
          {placeholder}
        </BaseSelect.Value>
        <BaseSelect.Icon
          render={<Icon icon="chevronDown" className="h-4 w-4 shrink-0" />}
        />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          align="end"
          sideOffset={4}
          className="z-50"
        >
          <BaseSelect.Popup
            className={classNames(
              'flex min-w-(--anchor-width) flex-col gap-0.5 rounded-2xl p-1.5 shadow-glass outline-0 transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-starting-style:scale-[0.96] data-starting-style:opacity-0 motion-reduce:transition-none dark:shadow-glass-dark',
              menuSurfaceClasses[variant],
              // Same Safari backdrop-root problem the dropdown menu has: the
              // frosted surface leaves for the colour it resolves to.
              variant === 'glass' && 'data-ending-style:glass-surface-opaque',
            )}
          >
            <BaseSelect.List>
              {items.map(item => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className={classNames(
                    'flex w-full cursor-pointer select-none items-center rounded-[10px] px-2.5 py-1.5 text-sm text-pca-grey-900 outline-0 transition-colors duration-150 dark:text-pca-white',
                    itemClasses[variant],
                    'data-disabled:pointer-events-none data-disabled:opacity-30',
                  )}
                >
                  <BaseSelect.ItemText className="grow">
                    {item.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="ml-2 shrink-0">
                    <Icon icon="check" className="h-4 w-4" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
};
