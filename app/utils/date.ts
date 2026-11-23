const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
};

/**
 * The browser's preferred language, from the `Accept-Language` header
 * of the request — the loader formats dates, so the server and the
 * client render the same text.
 */
function getRequestLocale(request: Request) {
  const [preferred = ''] = (request.headers.get('accept-language') ?? '')
    .split(',');
  const locale = preferred.split(';')[0].trim();

  try {
    return Intl.getCanonicalLocales(locale)[0];
  }
  catch {
    return undefined;
  }
}

/** A calendar date in the format of the browser's language. */
export function formatDate(date: Date, request: Request) {
  return new Intl.DateTimeFormat(getRequestLocale(request), dateFormatOptions)
    .format(date);
}

const longDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A calendar date written out, like "23 December 2026", in any locale. */
export function formatLongDate(date: Date) {
  return longDateFormat.format(date);
}
