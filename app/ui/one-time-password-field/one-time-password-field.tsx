import { OTPInput } from 'input-otp';
import { Label } from '../label/label';
// import { FormFieldStyle } from '../form-field-style/form-field-style';
import { Typography } from '../typography/typography';
import classNames from 'classnames';
import { FormFieldStyle } from '../form-field-style/form-field-style';

export interface OneTimePasswordFieldProps {
  label?: string;
  name: string;
  value: string;
  onChange(value: string): void;
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
    value,
    onChange,
    name,
    disabled,
  }) => {
    return (
      <div className={classNames('flex flex-col gap-2 group', className)}>
        {label && (
          <Label
            htmlFor={name}
            disabled={disabled}
          >
            {label}
          </Label>
        )}
        <OTPInput
          id={name}
          maxLength={6}
          containerClassName="flex justify-between w-full"
          value={value}
          onChange={onChange}
          name={name}
          disabled={disabled}
          pushPasswordManagerStrategy="none"
          data-lpignore="true"
          data-1p-ignore="true"
          render={({ slots }) => slots.map((slot, idx) => (
            <FormFieldStyle
              // eslint-disable-next-line @eslint-react/no-array-index-key
              key={idx}
              as="div"
              aria-invalid={!!errorMessage}
              aria-errormessage={errorMessage ? `otp-error` : undefined}
              className={classNames('w-11 h-11 text-center', {
                'ring-2': slot.isActive,
              })}
            >
              {slot.char}
            </FormFieldStyle>
          ))}
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
