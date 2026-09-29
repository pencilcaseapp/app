import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import { useState, type FC } from 'react';

export interface DocumentGroupRootProps {
  children: React.ReactNode;
  defaultValue?: string[];
}

/**
 * The groups only animate once somebody opens or closes one: an open group
 * in the server's HTML would otherwise play its opening animation on load,
 * and its documents would grow in instead of being there.
 */
export const DocumentGroupRoot: FC<DocumentGroupRootProps>
  = ({ children, defaultValue }) => {
    const [hasToggled, setHasToggled] = useState(false);

    return (
      <AccordionRoot
        type="multiple"
        className="flex flex-col gap-1.5"
        defaultValue={defaultValue}
        data-animated={hasToggled ? '' : undefined}
        onValueChange={() => setHasToggled(true)}
      >
        {children}
      </AccordionRoot>
    );
  };
