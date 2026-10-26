import type { FC } from 'react';
import { FREE_PLAN, PRO_PLAN } from '~/constants/plans';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { Button } from '~/ui/button/button';
import { PlanComparison } from '~/ui/plan-comparison/plan-comparison';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '~/ui/sidebar/sidebar';
import { UpgradeDialog } from '~/ui/upgrade-dialog/upgrade-dialog';

export interface DocumentLimitDialogProps {
  /** The route that starts the checkout; left out in the native apps,
   * which only say that the limit is reached. */
  checkoutUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/*
 * What "Create Doc" opens once a free account owns as many docs as the
 * plan allows. The upgrade is a plain link to the checkout route, like
 * the one in the subscription settings; the native apps sell nothing
 * and only say how to make room (`docs/native-apps.md`). Render it
 * inside the sidebar's drawer tree, so it stacks on top of the sidebar
 * on mobile, as tall as the sidebar like the delete sheet.
 */
export const DocumentLimitDialog: FC<DocumentLimitDialogProps> = ({
  checkoutUrl,
  open,
  onOpenChange,
}) => {
  if (!checkoutUrl) {
    return (
      <UpgradeDialog
        open={open}
        onOpenChange={onOpenChange}
        minHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
        title="Create Doc"
        headline="Doc limit reached."
        description={`You’ve used all ${FREE_DOCUMENT_LIMIT} of your free `
          + 'docs. Delete one to make room for a new one.'}
      />
    );
  }

  return (
    <UpgradeDialog
      open={open}
      onOpenChange={onOpenChange}
      minHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
      maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
      headline="Need more docs?"
      description={`You’ve used all ${FREE_DOCUMENT_LIMIT} of your free docs, `
        + 'but getting more is easy.'}
      pricingArea={(
        <PlanComparison
          currentPlan={{
            ...FREE_PLAN,
            actionArea: (
              <Button disabled className="w-full">Current plan</Button>
            ),
          }}
          upgradePlan={{
            ...PRO_PLAN,
            actionArea: (
              <Button
                as="a"
                href={checkoutUrl}
                className="w-full"
                colorDark="grey-900"
              >
                Upgrade to Pro
              </Button>
            ),
            finePrint: 'Secure checkout by Creem.',
          }}
        />
      )}
    />
  );
};
