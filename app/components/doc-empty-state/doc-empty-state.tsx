import { EmptyState } from '~/ui/empty-state/empty-state';
import { Topbar } from '~/ui/topbar/topbar';
import { MenuOrSignInButton } from '../menu-or-sign-in-button/menu-or-sign-in-button';
import { PageTitle } from '../page-title/page-title';

export interface DocEmptyStateProps {
  title: string;
  description: string;
  actionArea?: React.ReactNode;
  signInUrl?: string | null;
}

export const DocEmptyState: React.FC<DocEmptyStateProps>
  = ({ title, description, actionArea, signInUrl }) => {
    return (
      <div className="h-dvh">
        <PageTitle>{title}</PageTitle>
        <Topbar
          left={<MenuOrSignInButton signInUrl={signInUrl} />}
        />
        <EmptyState
          title={title}
          description={description}
          actionArea={actionArea}
        />
      </div>
    );
  };
