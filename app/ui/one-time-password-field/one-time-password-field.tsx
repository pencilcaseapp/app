import { Root, Input, HiddenInput } from '@radix-ui/react-one-time-password-field';
import { Label } from '../label/label';
import { FormFieldStyle } from '../form-field-style/form-field-style';
import { Typography } from '../typography/typography';
import classNames from 'classnames';

export interface OneTimePasswordFieldProps {
  label?: string;
  name: string;
  value: string;
  autoSubmit?: boolean;
  onValueChange(value: string): void;
  disabled?: boolean;
  hint?: string;
  errorMessage?: string;
  className?: string;
}

export const OneTimePasswordField: React.FC<OneTimePasswordFieldProps>
  = ({
    label,
    hint,
    errorMessage,
    className,
    ...props
  }) => {
    return (
      <div className={classNames('flex flex-col gap-2 group', className)}>
        {label && (
          <Label
            htmlFor="otp-1"
            disabled={props.disabled}
          >
            {label}
          </Label>
        )}
        <Root {...props} className="flex justify-between w-full">
          <Input asChild>
            <FormFieldStyle
              id="otp-1"
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className="w-11 h-11 text-center"
            />
          </Input>
          <Input asChild>
            <FormFieldStyle
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className="w-11 h-11 text-center"
            />
          </Input>
          <Input asChild>
            <FormFieldStyle
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className="w-11 h-11 text-center"
            />
          </Input>
          <Input asChild>
            <FormFieldStyle
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className="w-11 h-11 text-center"
            />
          </Input>
          <Input asChild>
            <FormFieldStyle
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className="w-11 h-11 text-center"
            />
          </Input>
          <Input asChild>
            <FormFieldStyle
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className="w-11 h-11 text-center"
            />
          </Input>
          <HiddenInput />
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
