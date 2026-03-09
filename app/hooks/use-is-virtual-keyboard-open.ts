import { useEffect, useState } from 'react';

export const useIsVirtualKeyboardOpen = () => {
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen]
    = useState<boolean>(false);

  useEffect(() => {
    if (!window.visualViewport) {
      return;
    }

    const listener = () => {
      if (!window.visualViewport) {
        return;
      }

      setIsVirtualKeyboardOpen(
        window.visualViewport.height < window.innerHeight,
      );
    };

    window.visualViewport.addEventListener('resize', listener);
    return () => {
      if (!window.visualViewport) {
        return;
      }

      window.visualViewport.removeEventListener('resize', listener);
    };
  }, []);

  return { isVirtualKeyboardOpen };
};
