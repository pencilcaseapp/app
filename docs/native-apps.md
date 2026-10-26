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

## Selling nothing in the apps

Pro is sold only on the web, through Creem, so the apps pay Apple and Google
nothing. That holds only while the apps sell nothing and point to no
purchase: Apple's guidelines (3.1.1, 3.1.3) allow an app without In-App
Purchase as long as it does not, within the app, encourage users to buy
some other way, outside the US storefront not even with plain text; links
out cost a commission in the EU. Google Play's consumption-only apps need no
Play Billing as long as nothing can be bought in the app and nothing links
to a purchase. So the apps follow Apple's stricter rule on both platforms:

- no upgrade button, offer, plan comparison or price anywhere: the sidebar
  keeps the usage meter, the subscription section shows the plan and its
  usage or status, "Create Doc" at the limit says to delete a doc, and the
  share panel drops the invite teaser;
- no billing: no "Manage subscription" button, and a failed payment points
  to the email we send about it rather than to the customer portal;
- `/doc/:id/checkout` and `/billing-portal` refuse requests from the apps,
  so nothing inside them reaches Creem even through a stray link, and the
  universal links below keep the billing paths in the browser.

The server tells the apps from a browser by `PencilCaseApp` in the user
agent (`isNativeAppRequest`), and the loaders hand that to the components
as `isNativeApp`. The subscription itself unlocks Pro in the apps as on the
web, through `users.has_subscription`; emails about it are outside the app
and keep their links. The store listings must not mention prices or buying
on the web either.

## Universal links

Links to `docs.pencilcase.app` open the iOS app when it is installed:
`/.well-known/apple-app-site-association` (`routes/apple-app-site-association.ts`)
claims every path for the app, and the `applinks:` associated domain in
`App.entitlements` claims the domain. `SceneDelegate` hands the link to
`MainViewController.open`, which loads its path on the server the app points
at. The paths in `BROWSER_ONLY_PATHS` (`app/constants/native-app.ts`), the
upgrade, the checkout and the billing portal, stay in Safari, which keeps
selling the subscription out of the app and away from In-App Purchase rules.
Apple fetches the file through its CDN when the app is installed, so a change
reaches devices only after a while.

Android does the same with App Links: `/.well-known/assetlinks.json`
(`routes/assetlinks.ts`) names the app and the fingerprint of Google Play's
app signing key (`ANDROID_CERT_FINGERPRINTS`), and the `autoVerify` intent
filter in `AndroidManifest.xml` claims the domain. `MainActivity.onNewIntent`
loads the link the same way, also for the intent that launched the app. Only
Android 15 and later can leave paths out of an intent filter
(`uri-relative-filter-group`), so on older versions the billing paths reach
the app too, and `MainActivity` hands them straight to the browser. A
debug build is signed with another key and does not verify; allow it by hand
with `adb shell pm set-app-links-user-selection --user 0 --package
app.pencilcase.android true docs.pencilcase.app`.

## Bounce and pull to refresh

Capacitor turns the web view's bounce off on iOS; `BridgeViewController`
(`ios/App/App/MainViewController.swift`) turns it back on. Pulling the page
down past its top moves the whole web view, top bar and all, and reloads the
page once it has come down far enough. The spinner is drawn in front of the
page, in the empty band between the status bar and the top bar's buttons,
which the page comes down with. The gap above the page, and the web view
where the page bounces past its end (which Capacitor paints in the system
background), have the page's own background, which WebKit reports as
`underPageBackgroundColor` (the yellow of the sign in page, say). Its ticks come in one by one as in Mail
(`RefreshIndicator`): a `UIRefreshControl` only draws them that way for a
finger dragging its own scroll view, so they are drawn to its measure and the
turning is the system spinner's. `MainViewController`, which `SceneDelegate` puts in the window,
holds the web view for that: Capacitor makes the web view its controller's
own view, so the gap needs a controller around it. Not a
`UIRefreshControl`: that pulls the page within the web view, where WebKit
keeps the fixed top bar in place while it is pulled and lowers it in one go
while it refreshes (`obscuredContentInsets` does not change that). The web
view reports the window's safe area wherever it is moved
(`WindowSafeAreaWebView`), or the page would drop the room it keeps for the
status bar as it comes down. A reload throws the page away a few frames
before the new one paints, so a snapshot of the page as it was covers the
web view until the new one has loaded. Inside a `WKWebView` an element with its own
scrolling (the editor while editing, a drawer) is a scroll view of its own
and never pulls the page along.

Android's web view has neither, so `PullToRefreshPlugin` wraps it in a
`SwipeRefreshLayout`, which cannot see into the page: at the start of every
touch the page tells it whether a pull would pull the page itself down
(`useNativePullToRefresh`, `canPullToRefresh` in `app/utils/native-app.ts`).

## Icons and launch screen

The app icon is the yellow tile of the PWA icons, drawn from the SVGs in
`assets/` (`icon-only` for iOS, `icon-foreground` and `icon-background` for
Android's adaptive icon). After changing them, regenerate the iOS icon and
Android's legacy `ic_launcher` PNGs with:

```bash
npx @capacitor/assets@3 generate --ios --android
```

Android's adaptive icon is not generated: its foreground is a vector drawable
(`drawable/ic_launcher_foreground.xml`) written from `icon-foreground.svg`,
and its background the `ic_launcher_background` colour. The generator writes
foreground PNGs at the 48dp of a legacy icon, which blur wherever the icon is
drawn larger, so put back `mipmap-anydpi-v26` and delete the
`ic_launcher_foreground` and `ic_launcher_background` PNGs after running it,
and update the vector by hand when the artwork changes.

The launch screen is only the page background, so opening the app never
flashes: `systemBackgroundColor` in `LaunchScreen.storyboard` on iOS (the
splash screen plugin draws the same storyboard), `splash_background` in
`values` and `values-night` on Android, whose splash screen would otherwise
show the launcher icon and is handed a transparent one in
`AppTheme.NoActionBarLaunch`. Two iOS limits shaped this: a launch
screen whose snapshot is estimated over 25 MB is dropped for a black screen,
which any image does on an iPhone 17, and a colour from the asset catalog
renders with its light value in dark mode, which is why it is a system
colour and dark mode starts on black rather than `#101010`.
