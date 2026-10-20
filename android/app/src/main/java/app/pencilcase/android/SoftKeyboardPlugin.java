package app.pencilcase.android;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Opens the keyboard for a focus the page moved to editable content itself,
 * like the one a new document gets, for which the web view opens none. The
 * delay lets the web view hand the focus to its input connection first, as
 * Capacitor's own keyboard plugin does.
 */
@CapacitorPlugin(name = "SoftKeyboard")
public class SoftKeyboardPlugin extends Plugin {

    private static final int SHOW_DELAY_MS = 350;

    @PluginMethod
    public void show(PluginCall call) {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            WebView webView = getBridge().getWebView();
            InputMethodManager manager = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
            manager.showSoftInput(webView, 0);
            call.resolve();
        }, SHOW_DELAY_MS);
    }
}
