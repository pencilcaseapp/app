import type { PropsWithChildren } from 'react';

export const ToolbarGroup: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex gap-4 md:gap-2">
      {children}
    </div>
  );
};
