import { Button } from '~/ui/button/button';
import { Link } from '~/ui/link/link';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';

export interface MenuOrSignInButtonProps {
  signInUrl?: string | null;
}

export const MenuOrSignInButton: React.FC<MenuOrSignInButtonProps>
  = ({ signInUrl }) => {
    const { isSidebarOpen, setIsSidebarOpen, triggerRef } = useSidebarContext();

    if (signInUrl) {
      return (
        <Button
          as={Link}
          to={signInUrl}
          colorLight="upgrade"
          colorDark="upgrade"
        >
          Sign In
        </Button>
      );
    }

    return (
      <Button
        colorLight="secondary"
        colorDark="secondary"
        icon="sidebar"
        iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
        ref={triggerRef}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    );
  };
