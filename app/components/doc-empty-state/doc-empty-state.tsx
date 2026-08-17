import { EmptyState } from '~/ui/empty-state/empty-state';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
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
    const { isSidebarOpen } = useSidebarContext();

    return (
      <div className="h-dvh">
        <PageTitle>{title}</PageTitle>
        <Topbar
          hasBorder={isSidebarOpen}
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
