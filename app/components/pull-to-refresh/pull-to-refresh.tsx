import { useSyncExternalStore } from 'react';
import { usePullToRefresh } from '~/hooks/use-pull-to-refresh';
import { ActivityIndicator } from '~/ui/activity-indicator/activity-indicator';

export const PULL_TO_REFRESH_THRESHOLD = 80;

// The topbar's height (`h-14`): the wheel comes out from under it.
const TOPBAR_HEIGHT = 56;
const INDICATOR_SIZE = 20;

const subscribe = () => () => {};
// `navigator.standalone` only exists in Safari on iOS, and is only true
// for the app opened from the home screen, which has no reload button
// and no pull-to-refresh of its own.
const isInstalledOnIos = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const reload = () => window.location.reload();

/**
 * Reloads the page when it is pulled down past its top, the way lists in
 * iOS refresh, in the installed app on iOS only. Browsers bring their own.
 */
export const PullToRefresh: React.FC = () => {
  const enabled = useSyncExternalStore(
    subscribe,
    isInstalledOnIos,
    () => false,
  );
  const { distance, armed, refreshing } = usePullToRefresh({
    enabled,
    threshold: PULL_TO_REFRESH_THRESHOLD,
    onRefresh: reload,
  });

  if (distance === 0 && !refreshing) {
    return null;
  }

  // The wheel stays centred in the gap the pull opens up below the
  // topbar, and stops following once the pull is long enough.
  const gap = Math.min(distance, PULL_TO_REFRESH_THRESHOLD);
  const top = TOPBAR_HEIGHT + (gap - INDICATOR_SIZE) / 2;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2"
      style={{ top }}
    >
      <ActivityIndicator
        progress={distance / PULL_TO_REFRESH_THRESHOLD}
        spinning={armed || refreshing}
        className="text-pca-grey-500 dark:text-pca-grey-400"
      />
    </div>
  );
};
