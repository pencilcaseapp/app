package app.pencilcase.android;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public class MainActivity extends BridgeActivity {

    /** `BROWSER_ONLY_PATHS` in `app/constants/native-app.ts`. */
    private static final Pattern BROWSER_ONLY_PATH = Pattern.compile(
        "/(upgrade|billing-portal|doc/[^/]+/(checkout|settings/subscription))"
    );

    private View navigationBarBackground;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PullToRefreshPlugin.class);
        registerPlugin(SoftKeyboardPlugin.class);
        super.onCreate(savedInstanceState);
        addNavigationBarBackground();
    }

    /*
     * Capacitor hands the intent the app was launched with to this as well,
     * so a link that launched the app opens instead of the start page.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        openAppLink(intent);
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        paintNavigationBarBackground();
        matchSystemBarIconsToTheme(newConfig);
    }

    /*
     * Capacitor's system bars keep the icons of the theme the app started in,
     * dark ones on a dark page after switching to the dark theme.
     */
    private void matchSystemBarIconsToTheme(Configuration config) {
        boolean dark = (config.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(!dark);
        controller.setAppearanceLightNavigationBars(!dark);
    }

    /*
     * The page draws under the navigation bar and keeps what it pins to the
     * bottom clear of it, but its text scrolls through behind the bar. A strip
     * in the page's background covers it, except while the keyboard is up and
     * the bar sits below the keyboard.
     */
    private void addNavigationBarBackground() {
        ViewGroup content = findViewById(android.R.id.content);
        navigationBarBackground = new View(this);
        paintNavigationBarBackground();
        content.addView(
            navigationBarBackground,
            new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, Gravity.BOTTOM)
        );

        ViewCompat.setOnApplyWindowInsetsListener(navigationBarBackground, (view, insets) -> {
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());
            ViewGroup.LayoutParams params = view.getLayoutParams();
            params.height = keyboardVisible ? 0 : insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            view.setLayoutParams(params);

            return insets;
        });
    }

    /*
     * The window keeps the navigation bar colour of the theme the app started
     * in, and Android forces dark icons onto a bar whose colour is light, even
     * though it no longer paints that colour: hollow ones on the dark theme.
     */
    @SuppressWarnings("deprecation")
    private void paintNavigationBarBackground() {
        int color = ContextCompat.getColor(this, R.color.navigation_bar_background);
        navigationBarBackground.setBackgroundColor(color);
        getWindow().setNavigationBarColor(color);
    }

    /*
     * Loads a link to the web app (App Links, `assetlinks.json`) with its
     * path on the server the app points at, so a link to production opens on
     * a dev server too. The manifest only leaves the billing paths out from
     * Android 15 on, so before that they come here and go on to the browser.
     */
    private void openAppLink(Intent intent) {
        Uri link = intent.getData();
        if (bridge == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || link == null) {
            return;
        }

        if (BROWSER_ONLY_PATH.matcher(link.getPath() == null ? "" : link.getPath()).matches()) {
            openInBrowser(link);
            return;
        }

        Uri target = Uri.parse(bridge.getServerUrl())
            .buildUpon()
            .encodedPath(link.getEncodedPath())
            .encodedQuery(link.getEncodedQuery())
            .encodedFragment(link.getEncodedFragment())
            .build();
        bridge.getWebView().post(() -> bridge.getWebView().loadUrl(target.toString()));
    }

    /*
     * Opens a link in the browser: the default one, or the first that takes
     * it. A plain view intent would bring it straight back to the app.
     */
    private void openInBrowser(Uri link) {
        PackageManager packageManager = getPackageManager();
        Intent browser = new Intent(Intent.ACTION_VIEW, link).addCategory(Intent.CATEGORY_BROWSABLE);
        ResolveInfo preferred = packageManager.resolveActivity(
            new Intent(Intent.ACTION_VIEW, Uri.parse("https://")),
            PackageManager.MATCH_DEFAULT_ONLY
        );
        List<String> candidates = new ArrayList<>();
        for (ResolveInfo info : packageManager.queryIntentActivities(browser, 0)) {
            String browserPackage = info.activityInfo.packageName;
            if (!browserPackage.equals(getPackageName())) {
                candidates.add(browserPackage);
            }
        }
        if (candidates.isEmpty()) {
            return;
        }

        String preferredPackage = preferred == null ? null : preferred.activityInfo.packageName;
        browser.setPackage(candidates.contains(preferredPackage) ? preferredPackage : candidates.get(0));
        try {
            startActivity(browser);
        } catch (ActivityNotFoundException ignored) {
            // The browser went away in the meantime; the app stays where it is.
        }
    }
}
