import { Link } from 'react-router';
import { Button } from '~/ui/button/button';
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
        colorLight="glass"
        colorDark="glass"
        icon="sidebar"
        iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
        ref={triggerRef}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    );
  };
