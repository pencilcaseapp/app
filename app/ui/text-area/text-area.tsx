import classNames from 'classnames';
import type { TextareaHTMLAttributes } from 'react';
import { FormFieldStyle } from '../form-field-style/form-field-style';
import { Label } from '../label/label';
import { Typography } from '../typography/typography';

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  id: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
  className?: string;
}

/** The multi-line sibling of `TextField`, for free text such as a note. */
export const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  hint,
  errorMessage,
  className,
  disabled,
  rows = 4,
  ...props
}) => {
  return (
    <div className={classNames('flex flex-col gap-2', className)}>
      {label && (
        <Label htmlFor={id} disabled={disabled}>
          {label}
        </Label>
      )}
      <FormFieldStyle
        as="textarea"
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${id}-error` : undefined}
        className="resize-none"
        {...props}
      />
      {hint && !errorMessage && (
        <Typography
          as="span"
          variant="bodyTiny"
          textColorLight="grey-600"
          textColorDark="grey-400"
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
