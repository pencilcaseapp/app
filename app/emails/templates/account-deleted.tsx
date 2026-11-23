import { DELETED_ACCOUNT_RETENTION_DAYS } from '../../constants/account';
import { Layout } from '../ui/layout/layout';
import { LinkButton } from '../ui/link-button/link-button';
import { Typography } from '../ui/typography/typography';

const received = 'We received your request to delete your pencil case '
  + `account. In ${DELETED_ACCOUNT_RETENTION_DAYS} days we permanently `
  + 'delete your account, your documents and their images.';

export interface AccountDeletedEmailProps {
  /** The last day the account can be restored, written out. */
  restoreUntil: string;
  signInUrl: string;
}

export function accountDeletedEmailSubject() {
  return 'Your pencil case account will be deleted';
}

/*
 * Confirms a deletion the user asked for in the settings and says how to
 * take it back: signing in again with the same address restores the
 * account until the purge.
 */
export function AccountDeletedEmail({
  restoreUntil,
  signInUrl,
}: AccountDeletedEmailProps) {
  return (
    <Layout preview={`Sign in by ${restoreUntil} to keep your account.`}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-3"
      >
        Sad to
        <br />
        see you go
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {received}
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        Until then you can always restore it. Sign in with this e-mail
        address by
        {' '}
        {restoreUntil}
        {' '}
        and your account is back, with all your documents.
      </Typography>
      <LinkButton href={signInUrl}>
        Sign in
      </LinkButton>
    </Layout>
  );
}

AccountDeletedEmail.PreviewProps = {
  restoreUntil: '23 December 2026',
  signInUrl: 'https://docs.pencilcase.app/signin',
} satisfies AccountDeletedEmailProps;

export default AccountDeletedEmail;
