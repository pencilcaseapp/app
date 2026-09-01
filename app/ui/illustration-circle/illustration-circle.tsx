import classNames from 'classnames';
import type { FC } from 'react';

export interface IllustrationCircleProps {
  /** A 2x PNG with a transparent background, so it stays crisp on
   * retina displays. */
  src: string;
  /** Empty for a decorative illustration. */
  alt?: string;
  className?: string;
}

/**
 * A yellow disc with an illustration peeking out of it: the image is
 * larger than the disc and clipped by it, so its figure fills the
 * circle. The surface stays yellow in both themes.
 */
export const IllustrationCircle: FC<IllustrationCircleProps> = ({
  src,
  alt = '',
  className,
}) => {
  return (
    <div
      className={classNames([
        'relative size-30 shrink-0 overflow-hidden rounded-full',
        'bg-pca-yellow-300',
        className,
      ])}
    >
      <img
        src={src}
        alt={alt}
        width={142}
        height={142}
        className="absolute left-1/2 top-[3px] size-[142px] max-w-none -translate-x-1/2"
      />
    </div>
  );
};
