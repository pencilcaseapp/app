import type { FC } from 'react';
import { Avatar } from '~/ui/avatar/avatar';
import { Typography } from '~/ui/typography/typography';

export interface PersonWithAccess {
  name: string | null;
  email: string;
}

export interface PeopleWithAccessProps {
  owner: PersonWithAccess;
}

/*
 * Everybody who can open the document. Only the owner for now — invited
 * people land here once inviting exists.
 */
export const PeopleWithAccess: FC<PeopleWithAccessProps> = ({ owner }) => {
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
      </Typography>
      <ul className="flex flex-col gap-1">
        <PersonRow person={owner} trailing="Owner" />
      </ul>
    </section>
  );
};

const PersonRow: FC<{ person: PersonWithAccess; trailing: string }> = ({
  person,
  trailing,
}) => {
  const displayName = person.name ?? person.email;

  return (
    <li className="flex min-h-11 items-center gap-3">
      <Avatar as="span" name={displayName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography
          variant="bodySmall"
          fontWeight="medium"
          as="span"
          className="truncate"
        >
          {displayName}
        </Typography>
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
      <Typography
        variant="bodySmall"
        as="span"
        textColorLight="grey-600"
        textColorDark="grey-400"
        className="shrink-0 pr-1"
      >
        {trailing}
      </Typography>
    </li>
  );
};
