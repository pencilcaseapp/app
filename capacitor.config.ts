import type { CapacitorConfig } from '@capacitor/cli';

const url = process.env.CAPACITOR_SERVER_URL ?? 'https://docs.pencilcase.app';

export default {
  appId: 'app.pencilcase',
  appName: 'pencil case',
  webDir: 'native/www',
  // Lets the server tell the app from a browser (`isNativeAppRequest`).
  appendUserAgent: 'PencilCaseApp',
  server: {
    url,
    cleartext: url.startsWith('http://'),
  },
} satisfies CapacitorConfig;
