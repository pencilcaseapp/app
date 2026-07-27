import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import type { FC } from 'react';

export interface DocumentGroupRootProps {
  children: React.ReactNode;
  defaultValue?: string[];
}

export const DocumentGroupRoot: FC<DocumentGroupRootProps>
  = ({ children, defaultValue }) => {
    return (
      <AccordionRoot
        type="multiple"
        className="flex flex-col gap-1.5"
        defaultValue={defaultValue}
      >
        {children}
      </AccordionRoot>
    );
  };
