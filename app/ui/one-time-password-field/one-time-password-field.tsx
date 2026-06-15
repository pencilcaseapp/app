import { Root, Input } from '@radix-ui/react-one-time-password-field';
import { Label } from '../label/label';
import { FormFieldStyle } from '../form-field-style/form-field-style';
import { Typography } from '../typography/typography';
import classNames from 'classnames';

export interface OneTimePasswordFieldProps {
  label?: string;
  value: string;
  autoSubmit?: boolean;
  onAutoSubmit?(): void;
  onValueChange(value: string): void;
  disabled?: boolean;
  hint?: string;
  errorMessage?: string;
  className?: string;
  onBlur?(): void;
}

export const OneTimePasswordField: React.FC<OneTimePasswordFieldProps>
  = ({
    label,
    disabled,
    hint,
    errorMessage,
    className,
    onBlur,
    ...props
  }) => {
    const PASSWORD_LENGTH = 6;

    return (
      <div className={classNames('flex flex-col gap-2 group', className)}>
        {label && (
          <Label
            htmlFor="otp-0"
            disabled={disabled}
          >
            {label}
          </Label>
        )}
        <Root {...props} className="flex justify-between w-full">
          {Array.from({ length: PASSWORD_LENGTH }).map((_, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key
            <Input key={index} asChild>
              <FormFieldStyle
                id={`otp-${index}`}
                type="text"
                aria-invalid={!!errorMessage}
                aria-errormessage={errorMessage ? `otp-error` : undefined}
                disabled={disabled}
                className="w-11 h-11 text-center"
                onBlur={onBlur}
              />
            </Input>
          ))}
        </Root>
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
            id="otp-error"
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
