import { href, Link } from 'react-router';
import { Button } from '~/ui/button/button';
import { Meter } from '~/ui/meter/meter';
import { useIconOnly } from '~/ui/navigation-item/icon-only-context';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';

export interface SidebarUpgradeProps {
  documentCount: number;
  documentLimit: number;
}

export const SidebarUpgrade: React.FC<SidebarUpgradeProps> = ({
  documentCount,
  documentLimit,
}) => {
  const isIconOnly = useIconOnly();
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
        to={href('/upgrade')}
        colorLight="upgrade"
        onClick={closeOnNavigate}
      >
        Upgrade to Pro
      </Button>
    </div>
  );
};
