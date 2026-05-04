import type { InputHTMLAttributes } from 'react';
import { Typography } from '../typography/typography';
import { FormFieldStyle } from '../form-field-style/form-field-style';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  id: string;
  label: string;
  type?: 'text' | 'password' | 'email';
  hint?: string;
  errorMessage?: string;
};

export const TextField: React.FC<TextFieldProps> = ({ type = 'text', id, label, hint, errorMessage, ...props }) => {
  return (
    <div className="flex flex-col gap-2 group">
      {label && (
        <Typography
          as="label"
          htmlFor={id}
          variant="bodySmall"
          fontWeight="semibold"
          textColorLight="grey-900"
          textColorDark="grey-300"
          className="group-has-disabled:text-pca-grey-300 dark:group-has-disabled:text-pca-grey-800"
        >
          {label}
        </Typography>
      )}
      <FormFieldStyle
        id={id}
        type={type}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${id}-error` : undefined}
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
