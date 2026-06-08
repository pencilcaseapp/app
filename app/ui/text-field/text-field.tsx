import type { InputHTMLAttributes } from 'react';
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
  className?: string;
};

export const TextField: React.FC<TextFieldProps> = ({ type = 'text', id, label, hint, errorMessage, className, disabled, ...props }) => {
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
      <FormFieldStyle
        id={id}
        type={type}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${id}-error` : undefined}
        disabled={disabled}
        {...props}
      />
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
