/**
 * How long a deleted account can be restored by signing in again before
 * it is purged, along with everything it owns.
 */
export const DELETED_ACCOUNT_RETENTION_DAYS = 30;

export const DELETED_ACCOUNT_RETENTION_MS
  = DELETED_ACCOUNT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const accountCopies = {
  restored: 'Welcome back, your account has been restored',
  deletionFailed: 'Your account could not be deleted. Please try again.',
};
