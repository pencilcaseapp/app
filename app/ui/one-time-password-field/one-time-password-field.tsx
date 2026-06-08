import { Root, Input } from '@radix-ui/react-one-time-password-field';
import { TextField } from '../text-field/text-field';

export interface OneTimePasswordFieldProps {
  value: string;
  autoSubmit?: boolean;
  onAutoSubmit?(): void;
  onValueChange(value: string): void;
}

export const OneTimePasswordField: React.FC<OneTimePasswordFieldProps>
  = (props) => {
    const PASSWORD_LENGTH = 6;

    return (
      <Root {...props} className="flex justify-between w-full">
        {Array.from({ length: PASSWORD_LENGTH }).map((_, index) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key
          <Input key={index} asChild>
            <TextField id={`otp-${index}`} inputClassName="w-11 h-11 text-center" />
          </Input>
        ))}
      </Root>
    );
  };
