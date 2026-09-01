import { Link } from 'react-router';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { Button } from '~/ui/button/button';
import { Meter } from '~/ui/meter/meter';
import { useIconOnly } from '~/ui/navigation-item/icon-only-context';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';

export interface SidebarUpgradeProps {
  documentCount: number;
  documentLimit: number;
  /** The subscription settings to open. */
  to: string;
}

export const SidebarUpgrade: React.FC<SidebarUpgradeProps> = ({
  documentCount,
  documentLimit,
  to,
}) => {
  const isIconOnly = useIconOnly();
  const isMobile = useIsMobile();
  const { closeOnNavigate } = useSidebarContext();

  if (isIconOnly) {
    return null;
  }

  const documentsLeft = Math.max(0, documentLimit - documentCount);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Meter
        label={`${documentsLeft} free doc(s) left.`}
        value={Math.min(documentCount, documentLimit)}
        max={documentLimit}
      />
      <Button
        as={Link}
        to={to}
        // The settings dialog opens over the document, which keeps its
        // scroll position; on mobile the drawer stacks on the open
        // sidebar instead of replacing it.
        preventScrollReset
        onClick={isMobile ? undefined : closeOnNavigate}
        colorLight="upgrade"
      >
        Upgrade to Pro
      </Button>
    </div>
  );
};
