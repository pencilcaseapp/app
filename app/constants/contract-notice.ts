/**
 * The two kinds of cancellation § 312k BGB asks the cancel form to tell
 * apart: notice under the terms, or for good cause, which needs a reason.
 */
export const CANCELLATION_TYPES = ['ordinary', 'extraordinary'] as const;

export type CancellationType = typeof CANCELLATION_TYPES[number];

/**
 * A cancellation (§ 312k BGB) or a withdrawal (§ 356a BGB) sent through
 * the website's forms. `endsOn` is the day the customer asked for, as
 * `YYYY-MM-DD`; without one the contract ends at the earliest date it
 * allows.
 */
export type ContractNotice =
  | {
    kind: 'cancellation';
    name: string;
    email: string;
    cancellationType: CancellationType;
    reason: string | null;
    endsOn: string | null;
  }
  | {
    kind: 'withdrawal';
    name: string;
    email: string;
  };
