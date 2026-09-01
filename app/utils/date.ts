const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A calendar date the way the app writes it, e.g. `06.07.2026`. */
export function formatDate(date: Date) {
  return dateFormat.format(date);
}
