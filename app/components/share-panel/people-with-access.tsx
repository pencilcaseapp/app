import type { FC, ReactNode } from 'react';
import { href, useFetcher } from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import type { DocumentAccess } from '~/constants/document';
import type { InvitedCollaborator } from '~/services/document-invite';
import { Avatar } from '~/ui/avatar/avatar';
import { Badge } from '~/ui/badge/badge';
import { ChoiceTrigger } from '~/ui/choice-trigger/choice-trigger';
import { DropdownMenu } from '~/ui/dropdown-menu/dropdown-menu';
import { DropdownMenuContent } from '~/ui/dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '~/ui/dropdown-menu/dropdown-menu-item';
import { DropdownMenuPortal } from '~/ui/dropdown-menu/dropdown-menu-portal';
import { DropdownMenuSeparator } from '~/ui/dropdown-menu/dropdown-menu-separator';
import { DropdownMenuTrigger } from '~/ui/dropdown-menu/dropdown-menu-trigger';
import { Icon } from '~/ui/icon/icon';
import { Typography } from '~/ui/typography/typography';

export interface PersonWithAccess {
  name: string | null;
  email: string;
}

export type InvitedPerson = InvitedCollaborator;

export interface PeopleWithAccessProps {
  documentId: string;
  owner: PersonWithAccess;
  invited: InvitedPerson[];
}

const ACCESS_LABELS: Record<DocumentAccess, string> = {
  view: 'Can view',
  edit: 'Can edit',
};

/*
 * Everybody who can open the document by name: the owner, then the people
 * invited by e-mail in the order they were invited. Whoever came in
 * through the link is not listed — the link row above stands for them.
 */
export const PeopleWithAccess: FC<PeopleWithAccessProps> = ({
  documentId,
  owner,
  invited,
}) => {
  return (
    <section>
      <Typography
        variant="bodyTiny"
        fontWeight="semibold"
        as="h3"
        textColorLight="grey-600"
        textColorDark="grey-400"
        className="pb-2"
      >
        People with access
        <span className="font-normal">
          {` · ${invited.length + 1}`}
        </span>
      </Typography>
      <ul className="flex flex-col gap-1">
        <PersonRow
          person={owner}
          trailing={(
            <Typography
              variant="bodySmall"
              as="span"
              textColorLight="grey-600"
              textColorDark="grey-400"
              className="shrink-0 pr-1"
            >
              Owner
            </Typography>
          )}
        />
        {invited.map(person => (
          <InvitedPersonRow
            key={person.id}
            documentId={documentId}
            person={person}
          />
        ))}
      </ul>
    </section>
  );
};

/*
 * An invited person with the menu that changes or removes their access.
 * Both act straight away through their own fetcher: the chosen access
 * shows while the change is on its way, and a removed row is gone at once.
 */
const InvitedPersonRow: FC<{
  documentId: string;
  person: InvitedPerson;
}> = ({ documentId, person }) => {
  const accessFetcher = useFetcher();
  const removeFetcher = useFetcher();
  const csrfToken = useAuthenticityToken();
  const displayName = person.name ?? person.email;

  const access = accessFetcher.formData
    ? accessFetcher.formData.get('access') as DocumentAccess
    : person.access;

  if (removeFetcher.formData) {
    return null;
  }

  const handleAccessChange = (next: DocumentAccess) => {
    if (next === access) {
      return;
    }

    accessFetcher.submit(
      { access: next, csrf: csrfToken },
      {
        method: 'post',
        action: href('/doc/:id/collaborators/:collaboratorId/access', {
          id: documentId,
          collaboratorId: person.id,
        }),
      },
    );
  };

  const handleRemove = () => {
    removeFetcher.submit(
      { csrf: csrfToken },
      {
        method: 'post',
        action: href('/doc/:id/collaborators/:collaboratorId/remove', {
          id: documentId,
          collaboratorId: person.id,
        }),
      },
    );
  };

  return (
    <PersonRow
      person={person}
      badge={person.pending && (
        <Badge variant="neutral" size="small">Invited</Badge>
      )}
      trailing={(
        <DropdownMenu>
          <DropdownMenuTrigger>
            {/*
              * Same pull as the link access chooser: the trigger's own
              * padding comes out so the caret lines up with the switch.
              */}
            <ChoiceTrigger
              aria-label={`Access for ${displayName}`}
              className="-mr-1"
            >
              {ACCESS_LABELS[access]}
            </ChoiceTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              align="end"
              variant="solid"
              className="min-w-48!"
            >
              {(Object.keys(ACCESS_LABELS) as DocumentAccess[]).map(value => (
                <DropdownMenuItem
                  key={value}
                  as="button"
                  onSelect={() => handleAccessChange(value)}
                  trailing={value === access && (
                    <Icon icon="check" className="h-4 w-4" />
                  )}
                >
                  {ACCESS_LABELS[value]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                as="button"
                color="danger"
                onSelect={handleRemove}
              >
                Remove access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}
    />
  );
};

const PersonRow: FC<{
  person: PersonWithAccess;
  badge?: ReactNode;
  trailing: ReactNode;
}> = ({ person, badge, trailing }) => {
  const displayName = person.name ?? person.email;

  return (
    <li className="flex min-h-11 items-center gap-3">
      <Avatar as="span" name={displayName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <Typography
            variant="bodySmall"
            fontWeight="medium"
            as="span"
            className="truncate"
          >
            {displayName}
          </Typography>
          {badge}
        </span>
        {person.name && (
          <Typography
            variant="bodyTiny"
            as="span"
            textColorLight="grey-600"
            textColorDark="grey-400"
            className="truncate"
          >
            {person.email}
          </Typography>
        )}
      </div>
      {trailing}
    </li>
  );
};
