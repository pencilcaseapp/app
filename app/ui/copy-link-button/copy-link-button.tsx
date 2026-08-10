import { useEffect, useState } from 'react';
import { Button, type ButtonProps } from '../button/button';

export type CopyLinkButtonProps = {
  /** The value written to the clipboard. */
  link: string;
  /** Label of the idle state, e.g. "Copy link". */
  label: string;
  /** Label shown right after copying, e.g. "Link copied!". */
  copiedLabel: string;
  /** How long the copied state stays visible, in milliseconds. */
  copiedDuration?: number;
  onCopy?: (link: string) => void;
} & Omit<ButtonProps<'button'>, 'as' | 'children' | 'icon' | 'iconPosition'>;

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({
  link,
  label,
  copiedLabel,
  copiedDuration = 2000,
  onCopy,
  onClick,
  ...props
}) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = setTimeout(() => setIsCopied(false), copiedDuration);

    return () => clearTimeout(timeout);
  }, [isCopied, copiedDuration]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(link);
    setIsCopied(true);
    onCopy?.(link);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    copyToClipboard();
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      icon={isCopied ? 'check' : 'link'}
      iconPosition="start"
      aria-live="polite"
    >
      {isCopied ? copiedLabel : label}
    </Button>
  );
};
