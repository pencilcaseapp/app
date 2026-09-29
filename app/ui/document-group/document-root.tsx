import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import { useState, type FC } from 'react';

export interface DocumentGroupRootProps {
  children: React.ReactNode;
  defaultValue?: string[];
}

/**
 * The groups only animate once somebody opens or closes one: an open group
 * in the server's HTML would otherwise play its opening animation on load,
 * and its documents would grow in instead of being there. The value is
 * controlled because Radix reports an uncontrolled change only after the
 * group has already closed, too late for the first toggle to animate.
 */
export const DocumentGroupRoot: FC<DocumentGroupRootProps>
  = ({ children, defaultValue }) => {
    const [value, setValue] = useState(defaultValue ?? []);
    const [hasToggled, setHasToggled] = useState(false);

    return (
      <AccordionRoot
        type="multiple"
        className="flex flex-col gap-1.5"
        value={value}
        data-animated={hasToggled ? '' : undefined}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          setHasToggled(true);
        }}
      >
        {children}
      </AccordionRoot>
    );
  };
