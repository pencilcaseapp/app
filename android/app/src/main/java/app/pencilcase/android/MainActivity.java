package app.pencilcase.android;

import android.content.res.Configuration;
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

public class MainActivity extends BridgeActivity {

    private View navigationBarBackground;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PullToRefreshPlugin.class);
        super.onCreate(savedInstanceState);
        addNavigationBarBackground();
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

    private void paintNavigationBarBackground() {
        navigationBarBackground.setBackgroundColor(ContextCompat.getColor(this, R.color.navigation_bar_background));
    }
}
