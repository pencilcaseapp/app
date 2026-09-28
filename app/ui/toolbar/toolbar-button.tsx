import { Button, type ButtonProps } from '../button/button';
import { Tooltip } from '../tooltip/tooltip';

export type ToolbarButtonProps = {
  tooltipLabel: string;
} & ButtonProps<'button'>;

/** A toolbar action that does something once, unlike a `ToolbarToggle`. */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  tooltipLabel,
  ...buttonProps
}) => {
  return (
    <Tooltip tooltip={tooltipLabel}>
      <Button
        colorLight="transparent"
        className="h-8!"
        aria-label={tooltipLabel}
        {...buttonProps}
      />
    </Tooltip>
  );
};
