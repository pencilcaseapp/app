const DOT_INSENSITIVE_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * The rate-limit key for an address: variants that deliver to the same
 * mailbox (case, +tags, dots in a Gmail local part) collapse into one
 * value, so codes requested for j.o.h.n+x@gmail.com count against
 * john@gmail.com. Only for keying — mail is still sent to the address
 * as entered.
 */
export function getCanonicalEmail(email: string) {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex === -1) {
    return normalized;
  }

  let local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  const plusIndex = local.indexOf('+');
  if (plusIndex !== -1) {
    local = local.slice(0, plusIndex);
  }

  if (DOT_INSENSITIVE_DOMAINS.has(domain)) {
    local = local.replaceAll('.', '');
  }

  return `${local}@${domain}`;
}
