# Native apps

The iOS and Android apps are a Capacitor shell around the web app: the
native web view loads `https://docs.pencilcase.app` (`server.url` in
`capacitor.config.ts`), so sessions, the live server and images work exactly
as in the browser. Nothing of the web app is bundled; `native/www` only holds
the page Capacitor needs as its `webDir`.

## Running

Install Xcode (iOS) or Android Studio (Android), then:

```bash
npx cap sync          # first, and after changing capacitor.config.ts or plugins
npx cap open ios      # opens Xcode, run on a simulator or device from there
npx cap open android  # opens Android Studio
```

`npx cap sync` writes files the native projects need but git ignores
(`capacitor.config.json`, `config.xml`, the `public` folder), so a fresh
checkout does not build until it has run once. Run `npm install` before
syncing: a plugin missing from `node_modules` is dropped from the native
projects without a warning.

To point the shell at a dev server instead of production, set
`CAPACITOR_SERVER_URL` while syncing, e.g. with the address `npm run dev`
prints for the local network:

```bash
CAPACITOR_SERVER_URL=http://192.168.1.10:3000 npx cap sync
```

Sync again without it before building anything you hand to someone else.

## Icons and launch screen

The app icon is the yellow tile of the PWA icons, drawn from the SVGs in
`assets/` (`icon-only` for iOS, `icon-foreground` and `icon-background` for
Android's adaptive icon). After changing them, regenerate every size with:

```bash
npx @capacitor/assets@3 generate --ios --android
```

The launch screen is only the page background, so opening the app never
flashes: `systemBackgroundColor` in `LaunchScreen.storyboard` on iOS (the
splash screen plugin draws the same storyboard), `splash_background` in
`values` and `values-night` on Android. Two iOS limits shaped this: a launch
screen whose snapshot is estimated over 25 MB is dropped for a black screen,
which any image does on an iPhone 17, and a colour from the asset catalog
renders with its light value in dark mode, which is why it is a system
colour and dark mode starts on black rather than `#101010`.
