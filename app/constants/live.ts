export enum LiveCloseReason {
  AccessRevoked = 'access-revoked',
}

/**
 * Sent over the document's connection when what the person may do changed
 * while they stay connected.
 */
export interface LiveAccessMessage {
  type: 'access';
  readOnly: boolean;
}
