import { useEffect, useState } from 'react';

export const useVirtualKeyboard = () => {
  const isTouchDevice = typeof matchMedia === 'function'
    && matchMedia('(pointer: coarse) and (hover: none)').matches;

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isTouchDevice) return;

    const listener = () => {
      setIsOpen(
        window.visualViewport
          ? window.visualViewport.height < window.innerHeight
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
