import type { InputHTMLAttributes } from 'react';
import classNames from 'classnames';
import { Label } from '../label/label';
import { FormFieldStyle } from '../form-field-style/form-field-style';
import { Typography } from '../typography/typography';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  id: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
  className?: string;
};

export const Checkbox: React.FC<CheckboxProps>
  = ({
    id,
    label,
    hint,
    errorMessage,
    disabled,
    className,
    ...props
  }) => {
    const classes = classNames(
      // Base styles
      'peer grid h-6 w-6 !p-0 !rounded-lg shrink-0 appearance-none cursor-pointer place-content-center after:hidden after:content-[\'\']',
      // Checked state
      'checked:after:bg-checkmark-white checked:border-pca-grey-800 checked:bg-pca-grey-800 checked:after:block checked:hover:border-pca-grey-900 checked:hover:bg-pca-grey-900 checked:after:h-[13px] checked:after:w-[13px]',
      // Disabled state
      'disabled:checked:after:opacity-30 disabled:checked:after:bg-checkmark-black dark:disabled:checked:after:bg-checkmark-white',
    );

    return (
      <div className={classNames('flex flex-col gap-2 group', className)}>
        <div className="flex gap-2">
          <FormFieldStyle
            id={id}
            type="checkbox"
            aria-invalid={!!errorMessage}
            aria-errormessage={errorMessage ? `${id}-error` : undefined}
            disabled={disabled}
            className={classes}
            {...props}
          />
          {label && (
            <Label
              htmlFor={id}
              disabled={disabled}
              variant="bodyTiny"
              fontWeight="regular"
              className={classNames(
                'pt-1.25 select-none',
                disabled ? 'pointer-events-none' : 'cursor-pointer',
              )}
            >
              {label}
            </Label>
          )}
        </div>
        {hint && !errorMessage && (
          <Typography
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
