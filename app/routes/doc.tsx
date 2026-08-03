import type { Route } from './+types/doc';
import { redirect } from 'react-router';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocument } from '~/repos/document';
import { ClientOnly } from '~/ui/client-only/client-only';
import { Button } from '~/ui/button/button';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { href, Link } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { useDocumentTitle } from '~/contexts/document-title';

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const document = await getDocument(params.id);

  if (!document) {
    throw new Response('Not Found', {
      status: 404,
    });
  }

  const documentTitle = document.title;
  const documentUrl = href(`/doc/:id`, { id: params.id });

  if (document.userId && user && user.id !== document.userId) {
    throw new Response('Forbidden', {
      status: 403,
    });
  }

  if (document.userId && !user) {
    return redirect(getSignInUrl(documentUrl));
  }

  const signInUrl = user ? null : getSignInUrl(documentUrl);

  return {
    documentTitle,
    signInUrl,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useDocumentTitle(loaderData.documentTitle);
  const { isSidebarOpen, setIsSidebarOpen, triggerRef } = useSidebarContext();

  return (
    <>
      <title>{title}</title>
      <ClientOnly>
        <CollaborativeEditor
          key={params.id}
          id={params.id}
          onTitleChange={setTitle}
          topbarLeft={
            loaderData.signInUrl
              ? (
                  <Button
                    as={Link}
                    to={loaderData.signInUrl}
                    colorLight="upgrade"
                    colorDark="upgrade"
                  >
                    Sign In
                  </Button>
                )
              : (
                  <Button
                    colorLight="secondary"
                    colorDark="secondary"
                    icon="sidebar"
                    iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
                    ref={triggerRef}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  />
                )
          }
        />
      </ClientOnly>
    </>
  );
}
