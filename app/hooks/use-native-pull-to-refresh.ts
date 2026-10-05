import { useEffect } from 'react';
import {
  canPullToRefresh,
  getNativePullToRefresh,
} from '~/utils/native-app';

/**
 * Tells the Android app's pull to refresh at the start of every touch
 * whether a pull would pull the page down, which only the page can know.
 */
export const useNativePullToRefresh = () => {
  useEffect(() => {
    const pullToRefresh = getNativePullToRefresh();
    if (!pullToRefresh) {
      return;
    }

    const onTouchStart = (event: TouchEvent) => {
      pullToRefresh
        .allow({ allowed: canPullToRefresh(event.target) })
        .catch(() => {});
    };
    const options = { capture: true, passive: true };
    window.addEventListener('touchstart', onTouchStart, options);

    return () => window.removeEventListener('touchstart', onTouchStart, options);
  }, []);
};
