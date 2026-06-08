import { Root, Input } from '@radix-ui/react-one-time-password-field';
import { TextField } from '../text-field/text-field';
import { Label } from '../label/label';

export interface OneTimePasswordFieldProps {
  label?: string;
  value: string;
  autoSubmit?: boolean;
  onAutoSubmit?(): void;
  onValueChange(value: string): void;
  disabled?: boolean;
}

export const OneTimePasswordField: React.FC<OneTimePasswordFieldProps>
  = ({ label, ...props }) => {
    const PASSWORD_LENGTH = 6;

    return (
      <div className="flex flex-col gap-2 group">
        {label && (
          <Label
            htmlFor="otp-0"
            disabled={props.disabled}
          >
            {label}
          </Label>
        )}
        <Root {...props} className="flex justify-between w-full">
          {Array.from({ length: PASSWORD_LENGTH }).map((_, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key
            <Input key={index} asChild>
              <TextField id={`otp-${index}`} inputClassName="w-11 h-11 text-center" />
            </Input>
          ))}
        </Root>
      </div>
    );
  };
