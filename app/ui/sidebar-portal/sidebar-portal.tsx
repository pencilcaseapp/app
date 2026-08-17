import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';
import { useMedia } from 'react-use';
import { AnimatePresence } from 'motion/react';
import { Root, Overlay, Content, Title } from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';

export type SidebarPortalProps = {
  mobileChildren?: ReactNode;
  desktopChildren?: ReactNode;
  a11yTitle?: string;
};

export const SidebarPortal: FC<SidebarPortalProps> = ({
  mobileChildren,
  desktopChildren,
  a11yTitle = '',
}) => {
  const { isSidebarOpen, setIsSidebarOpen, triggerRef } = useSidebarContext();
  const isDesktop = useMedia('(min-width: 1280px)', false);

  const isMobile = useMedia('(max-width: 640px)', false);
  const isScrollLocked = isMobile && isSidebarOpen;

  useEffect(() => {
    if (!isScrollLocked) {
      return;
    }
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isScrollLocked]);

  return (
    <>
      {!isDesktop
        ? (
            <AnimatePresence>
              {isSidebarOpen && (
                <Root open={isSidebarOpen} modal={false}>
                  <Overlay />
                  <Content
                    onOpenAutoFocus={event => event.preventDefault()}
                    className="outline-hidden"
                    onInteractOutside={(event) => {
                      /*
                        We need this to close the sidebar
                        when clicking outside of it (¯\_(ツ)_/¯)
                      */
                      if (isMobile) {
                        return;
                      }

                      if (triggerRef.current?.contains(
                        event.target as Node,
                      )) {
                        return;
                      }

                      setIsSidebarOpen(false);
                    }}
                    onEscapeKeyDown={() => setIsSidebarOpen(false)}
                    aria-describedby={undefined}
                  >
                    <VisuallyHidden>
                      <Title>{a11yTitle}</Title>
                    </VisuallyHidden>
                    {mobileChildren}
                  </Content>
                </Root>
              )}
            </AnimatePresence>
          )
        : (
            <>{desktopChildren}</>
          )}
    </>
  );
};
