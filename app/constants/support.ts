export const MAX_SUPPORT_MESSAGE_LENGTH = 5000;

/**
 * How many messages one account may send through the contact form within
 * `SUPPORT_REQUEST_WINDOW_MS`. Each one is an e-mail to our own inbox, so
 * the cap only keeps a single account from flooding it.
 */
export const SUPPORT_REQUEST_LIMIT = 10;

export const SUPPORT_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

export const supportRequestCopies = {
  messageRequired: 'Please write us a message',
  messageTooLong: 'Keep it under '
    + `${MAX_SUPPORT_MESSAGE_LENGTH} characters`,
  tooManyRequests: 'Too many messages. Please try again later',
  sent: 'Thanks, we’ll get back to you soon',
};
