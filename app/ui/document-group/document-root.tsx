import { Root as AccordionRoot } from '@radix-ui/react-accordion';
import type { FC, PropsWithChildren } from 'react';

export const DocumentGroupRoot: FC<PropsWithChildren> = ({ children }) => {
  return (
    <AccordionRoot
      type="multiple"
      className="flex flex-col gap-1.5"
    >
      {children}
    </AccordionRoot>
  );
};
