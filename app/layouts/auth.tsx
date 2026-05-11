import { Outlet } from 'react-router';
import { Logo } from '~/ui/logo/logo';

export const handle = {
  bodyClassName: 'w-full bg-pca-yellow-500 dark:bg-black',
};

export default function LayoutAuth() {
  return (
    <>
      <header className="h-13 md:h-23.75 flex items-center justify-center">
        <Logo />
      </header>
      <main className="px-4 md:max-w-74 mx-auto min-h-[calc(100dvh-52px)] md:min-h-[calc(100dvh-95px)] flex items-center">
        <div>
          <Outlet />
        </div>
      </main>
    </>
  );
};
