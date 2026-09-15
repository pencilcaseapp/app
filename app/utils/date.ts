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
