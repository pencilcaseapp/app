import { Switch as BaseSwitch } from '@base-ui-components/react/switch';
import classNames from 'classnames';
import { Label } from '../label/label';
import { Typography } from '../typography/typography';

export interface SwitchProps extends Pick<React.AriaAttributes, 'aria-label'> {
  id: string;
  name?: string;
  /** Visible label. Use `aria-label` instead when the design has no label. */
  label?: string;
  hint?: string;
  errorMessage?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onBlur?: (event: React.FocusEvent<HTMLSpanElement>) => void;
  className?: string;
};

export const Switch: React.FC<SwitchProps>
  = ({
    id,
    name,
    label,
    'aria-label': ariaLabel,
    hint,
    errorMessage,
    checked,
    defaultChecked,
    disabled,
    onCheckedChange,
    onBlur,
    className,
  }) => {
    const trackClasses = classNames([
      // Base styles
      'relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 outline-0 transition-colors duration-200 ease-in-out',
      // Disabled state
      disabled
      && 'cursor-not-allowed bg-pca-grey-100 dark:bg-pca-grey-800 data-checked:bg-pca-green-100',
      // Unchecked state
      !disabled
      && 'cursor-pointer bg-pca-grey-400 dark:bg-pca-grey-600 hover:bg-pca-grey-600 dark:hover:bg-pca-grey-800 focus:bg-pca-grey-300 dark:focus:bg-pca-grey-700 focus:ring-2 focus:ring-pca-grey-200 dark:focus:ring-pca-grey-500',
      // Checked state
      !disabled
      && 'data-checked:bg-pca-green-700 data-checked:hover:bg-pca-green-900 data-checked:focus:bg-pca-green-700 data-checked:focus:ring-pca-green-300',
    ]);

    const thumbClasses = classNames([
      // Base styles
      'block size-5 rounded-full shadow-primary transition-transform duration-200 ease-in-out',
      // Checked state
      'data-checked:translate-x-5',
      // Disabled state
      disabled
      && 'bg-pca-grey-100 dark:bg-pca-grey-700 data-checked:bg-pca-white',
      !disabled && 'bg-pca-white',
    ]);

    return (
      <div className={classNames('flex flex-col gap-2', className)}>
        <div className="flex gap-2">
          <BaseSwitch.Root
            id={id}
            name={name}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            onBlur={onBlur}
            aria-invalid={!!errorMessage}
            aria-errormessage={errorMessage ? `${id}-error` : undefined}
            aria-describedby={hint && !errorMessage ? `${id}-hint` : undefined}
            // The hidden `<input>` that `htmlFor` targets is `aria-hidden`, so
            // the label has to name the `role="switch"` element explicitly.
            aria-labelledby={label ? `${id}-label` : undefined}
            aria-label={ariaLabel}
            className={trackClasses}
          >
            <BaseSwitch.Thumb className={thumbClasses} />
          </BaseSwitch.Root>
          {label && (
            <Label
              id={`${id}-label`}
              htmlFor={id}
              disabled={disabled}
              className={classNames(
                'py-0.5 select-none',
                disabled ? 'pointer-events-none' : 'cursor-pointer',
              )}
            >
              {label}
            </Label>
          )}
        </div>
        {hint && !errorMessage && (
          <Typography
            id={`${id}-hint`}
            as="span"
            variant="bodyTiny"
            textColorLight="grey-900"
            textColorDark="white"
          >
            {hint}
          </Typography>
        )}
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
