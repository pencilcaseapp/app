import { Button, type ButtonProps } from '../button/button';

export type ShareLinkButtonProps = {
  /** The value handed to the native share sheet. */
  link: string;
  /** Label of the button, e.g. "Share link". */
  label: string;
  onShare?: (link: string) => void;
} & Omit<ButtonProps<'button'>, 'as' | 'children' | 'icon' | 'iconPosition'>;

export const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  link,
  label,
  onShare,
  onClick,
  ...props
}) => {
  const share = async () => {
    try {
      await navigator.share({ url: link });
      onShare?.(link);
    }
    catch {
      /*
       * Dismissing the share sheet rejects with an AbortError, and a browser
       * that refuses the call outright leaves us nothing to recover from
       * either.
       */
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    share();
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      icon="share"
      iconPosition="start"
    >
      {label}
    </Button>
  );
};
