import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { Button, type ButtonProps } from '../button/button';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

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
      aria-live="polite"
    >
      {/*
        * Both states stay mounted in the same grid cell, so the button keeps
        * the width of the wider label and the swap can play in either
        * direction without anything unmounting mid-transition.
        */}
      <span className="inline-grid">
        <CopyState
          isActive={!isCopied}
          icon="link"
          label={label}
          hiddenTranslate="-translate-y-1"
        />
        <CopyState
          isActive={isCopied}
          icon="check"
          label={copiedLabel}
          hiddenTranslate="translate-y-1"
        />
      </span>
    </Button>
  );
};

type CopyStateProps = {
  isActive: boolean;
  icon: IconName;
  label: string;
  /** Where the label rests while hidden, which sets its travel direction. */
  hiddenTranslate: '-translate-y-1' | 'translate-y-1';
};

const swapClasses = classNames([
  'ease-[cubic-bezier(0.25,0.1,0,1)] motion-reduce:transition-none',
]);

const CopyState: React.FC<CopyStateProps> = ({
  isActive,
  icon,
  label,
  hiddenTranslate,
}) => (
  <span
    className={classNames([
      'col-start-1 row-start-1 inline-flex items-center justify-center',
      'gap-2',
      !isActive && 'pointer-events-none',
    ])}
    aria-hidden={!isActive}
  >
    <Icon
      icon={icon}
      className={classNames([
        'w-4.5 h-4.5 shrink-0 transition-[opacity,scale,filter]',
        swapClasses,
        isActive && 'duration-300 opacity-100 scale-100 blur-none',
        !isActive && 'duration-200 opacity-0 scale-[0.3] blur-[3px]',
      ])}
    />
    <span
      className={classNames([
        'transition-[opacity,translate]',
        swapClasses,
        isActive && 'duration-300 opacity-100 translate-y-0',
        !isActive && classNames(['duration-200 opacity-0', hiddenTranslate]),
      ])}
    >
      {label}
    </span>
  </span>
);
