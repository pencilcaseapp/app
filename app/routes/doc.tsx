import type { Route } from './+types/doc';
import { redirect } from 'react-router';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocument } from '~/repos/document';
import { ClientOnly } from '~/ui/client-only/client-only';
import { href } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { useDocumentTitle } from '~/contexts/document-title';
import { MenuOrSignInButton } from '~/components/menu-or-sign-in-button/menu-or-sign-in-button';

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

  if (user && user.id !== document.userId) {
    throw new Response('Forbidden', {
      status: 403,
    });
  }

  if (!user) {
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

  return (
    <>
      <title>{title}</title>
      <ClientOnly>
        <CollaborativeEditor
          key={params.id}
          id={params.id}
          onTitleChange={setTitle}
          topbarLeft={(
            <MenuOrSignInButton
              signInUrl={loaderData.signInUrl}
            />
          )}
        />
      </ClientOnly>
    </>
  );
}
