# Native apps

The iOS and Android apps are a Capacitor shell around the web app: the
native web view loads `https://docs.pencilcase.app` (`server.url` in
`capacitor.config.ts`), so sessions, the live server and images work exactly
as in the browser. Nothing of the web app is bundled; `native/www` only holds
the page Capacitor needs as its `webDir`.

## Running

Install Xcode (iOS) or Android Studio (Android), then:

```bash
npx cap sync          # after changing capacitor.config.ts or adding plugins
npx cap open ios      # opens Xcode, run on a simulator or device from there
npx cap open android  # opens Android Studio
```

To point the shell at a dev server instead of production, set
`CAPACITOR_SERVER_URL` while syncing, e.g. with the address `npm run dev`
prints for the local network:

```bash
CAPACITOR_SERVER_URL=http://192.168.1.10:3000 npx cap sync
```

Sync again without it before building anything you hand to someone else.
