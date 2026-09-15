import { Toast } from '@base-ui/react/toast';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { SearchParamToast } from '~/constants/search-params';

/**
 * Emits a toast for every toast search param present in the URL, so an action
 * can hand its feedback over through a redirect.
 */
export const useToast = () => {
  const [searchParams] = useSearchParams();
  const { add } = Toast.useToastManager();

  const successMessage = searchParams.get(SearchParamToast.ToastSuccess);
  const infoMessage = searchParams.get(SearchParamToast.ToastInfo);
  const dangerMessage = searchParams.get(SearchParamToast.ToastDanger);

  /**
   * React Router hydrates the app in `StrictMode`, which runs the effect
   * twice, so the messages it emitted are remembered: only a message that
   * changed is a new toast.
   */
  const emittedRef = useRef<string | null>(null);

  useEffect(() => {
    const messages
      = JSON.stringify([successMessage, infoMessage, dangerMessage]);

    if (emittedRef.current === messages) {
      return;
    }

    emittedRef.current = messages;

    if (successMessage) {
      add({ type: 'success', title: decodeURIComponent(successMessage) });
    }

    if (infoMessage) {
      add({ type: 'info', title: decodeURIComponent(infoMessage) });
    }

    if (dangerMessage) {
      add({ type: 'danger', title: decodeURIComponent(dangerMessage) });
    }
  }, [add, successMessage, infoMessage, dangerMessage]);
};

/**
 * Emits a toast from a component, for feedback that stays on the page
 * instead of travelling through a redirect.
 */
export const useEmitToast = () => {
  const { add } = Toast.useToastManager();

  return add;
};
