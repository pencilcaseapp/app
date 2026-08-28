import { useMedia } from 'react-use';

// Tailwind's `sm` breakpoint (40rem): everything below it is mobile,
// matching the `width < theme(--breakpoint-sm)` media queries in CSS.
export const MOBILE_MEDIA_QUERY = '(width < 40rem)';

export const useIsMobile = () => useMedia(MOBILE_MEDIA_QUERY, false);
