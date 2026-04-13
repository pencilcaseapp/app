import { useEffect, useState } from 'react';
import { useMedia } from 'react-use';

export const useVirtualKeyboard = () => {
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    const listener = () => {
      setIsOpen(
        window.visualViewport
          ? window.innerHeight - window.visualViewport.height > 50
          : false,
      );
    };

    window.visualViewport?.addEventListener('resize', listener);

    return () => {
      window.visualViewport?.removeEventListener('resize', listener);
    };
  }, [isTouchDevice]);

  return [isOpen];
};
