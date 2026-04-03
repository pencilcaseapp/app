import { Toggle, type ToggleProps } from '../toggle/toggle';
import { Tooltip } from '../tooltip/tooltip';

export type ToolbarToggleProps = {
  tooltipLabel: string;
} & ToggleProps;

export const ToolbarToggle: React.FC<ToolbarToggleProps> = ({
  tooltipLabel,
  ...toggleProps
}) => {
  return (
    <Tooltip tooltip={tooltipLabel}>
      <Toggle className="h-8!" aria-label={tooltipLabel} {...toggleProps} />
    </Tooltip>
  );
};
