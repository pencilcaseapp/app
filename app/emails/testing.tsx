import { Tailwind, pixelBasedPreset, render } from 'react-email';
import { theme } from './theme';

export function renderEmail(email: React.ReactNode) {
  return render(
    <Tailwind theme={theme} config={pixelBasedPreset}>
      {email}
    </Tailwind>,
    { pretty: true },
  );
}
