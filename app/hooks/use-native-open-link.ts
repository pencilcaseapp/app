import { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * Lets the iOS app open a link it was handed (a universal link) as a
 * navigation within the page: loading it anew leaves the web view white
 * for a few frames. A resource route still loads as a document.
 */
export const useNativeOpenLink = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.openNativeLink = (path) => {
      void navigate(path);
      return true;
    };

    return () => {
      delete window.openNativeLink;
    };
  }, [navigate]);
};
