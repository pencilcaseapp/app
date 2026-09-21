import type { InputHTMLAttributes, ReactNode } from 'react';
import { Typography } from '../typography/typography';
import { FormFieldStyle } from '../form-field-style/form-field-style';
import classNames from 'classnames';
import { Label } from '../label/label';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  id: string;
  label?: string;
  type?: 'text' | 'password' | 'email';
  hint?: string;
  errorMessage?: string;
  /**
   * Content pinned to the right hand side of the field, inside its border —
   * a unit, a role chooser, a clear button. It sits next to the input rather
   * than over it, so it can be any width.
   */
  trailing?: ReactNode;
  className?: string;
};

/* With `trailing` the border moves to a box around the input, because the
   input no longer fills the field on its own. The box cannot take focus or be
   `:disabled`, so it reacts to the input through `focusWithin` and carries the
   disabled colours itself. */
const trailingInputClasses = 'min-w-0 grow bg-transparent p-3 text-sm font-inter text-pca-grey-900 dark:text-white outline-0 placeholder-pca-grey-400 dark:placeholder-pca-grey-500 disabled:text-pca-grey-400 dark:disabled:text-pca-grey-600 disabled:placeholder-pca-grey-300 dark:disabled:placeholder-pca-grey-800';

const trailingBoxDisabledClasses = 'pointer-events-none bg-pca-grey-100 dark:bg-pca-grey-800/30 border-pca-grey-200 dark:border-transparent';

export const TextField: React.FC<TextFieldProps> = ({ type = 'text', id, label, hint, errorMessage, trailing, className, disabled, ...props }) => {
  return (
    <div className={classNames('flex flex-col gap-2 group', className)}>
      {label && (
        <Label
          htmlFor={id}
          disabled={disabled}
        >
          {label}
        </Label>
      )}
      {trailing
        ? (
            <FormFieldStyle
              as="div"
              focusWithin={true}
              aria-invalid={!!errorMessage}
              className={classNames(
                'flex items-center gap-1.5 p-0 pr-1.5',
                disabled && trailingBoxDisabledClasses,
              )}
            >
              <input
                id={id}
                type={type}
                disabled={disabled}
                aria-invalid={!!errorMessage}
                aria-errormessage={errorMessage ? `${id}-error` : undefined}
                className={trailingInputClasses}
                {...props}
              />
              <div className="flex shrink-0 items-center">{trailing}</div>
            </FormFieldStyle>
          )
        : (
            <FormFieldStyle
              id={id}
              type={type}
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `${id}-error` : undefined}
              disabled={disabled}
              {...props}
            />
          )}
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
