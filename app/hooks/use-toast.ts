import { Toast } from '@base-ui/react/toast';
import { useEffect } from 'react';
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

  useEffect(() => {
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
