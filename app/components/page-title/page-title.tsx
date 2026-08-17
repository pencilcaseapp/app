import { commonCopies } from '~/constants/common-copies';

export interface PageTitleProps {
  children?: string | null;
}

export const PageTitle: React.FC<PageTitleProps> = ({ children }) => (
  <title>
    {children
      ? `${children} - ${commonCopies.appName}`
      : commonCopies.appName}
  </title>
);
