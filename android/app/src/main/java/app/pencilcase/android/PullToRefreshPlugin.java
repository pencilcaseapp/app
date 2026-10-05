package app.pencilcase.android;

import android.content.Context;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.WebViewListener;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pull to refresh, which the web view lacks, around the page. The page tells
 * at the start of every touch whether a pull would pull the page itself down
 * (`allow`), as a browser decides it for its own: not when the touch scrolls
 * something inside the page, like the editor while editing or a dialog.
 */
@CapacitorPlugin(name = "PullToRefresh")
public class PullToRefreshPlugin extends Plugin {

    // A page that failed to load says nothing, and can be pulled to load again.
    private volatile boolean pageAnswers = false;
    private volatile boolean allowed = true;

    /*
     * The page's answer arrives just after the touch has started, so a new
     * touch drops the answer about the last one rather than going by it.
     * And the layout has to see every touch start: one it is told to skip
     * leaves it measuring the pull from where an earlier touch started, which
     * turned a swipe up right after a tap higher up into a pull down.
     */
    private class Layout extends SwipeRefreshLayout {

        private boolean touchStarting = false;

        Layout(Context context) {
            super(context);
        }

        @Override
        public boolean onInterceptTouchEvent(MotionEvent event) {
            if (event.getActionMasked() != MotionEvent.ACTION_DOWN) {
                return super.onInterceptTouchEvent(event);
            }

            if (pageAnswers) {
                allowed = false;
            }
            touchStarting = true;
            try {
                return super.onInterceptTouchEvent(event);
            } finally {
                touchStarting = false;
            }
        }

        boolean isHeldBack() {
            return !touchStarting && !allowed;
        }
    }

    @Override
    public void load() {
        WebView webView = getBridge().getWebView();
        ViewGroup parent = (ViewGroup) webView.getParent();
        int index = parent.indexOfChild(webView);
        ViewGroup.LayoutParams params = webView.getLayoutParams();

        Layout layout = new Layout(getContext());
        parent.removeView(webView);
        layout.addView(webView, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        parent.addView(layout, index, params);

        layout.setOnChildScrollUpCallback((view, child) -> layout.isHeldBack() || webView.getScrollY() > 0);
        layout.setOnRefreshListener(webView::reload);
        getBridge()
            .addWebViewListener(
                new WebViewListener() {
                    @Override
                    public void onPageStarted(WebView view) {
                        pageAnswers = false;
                        allowed = true;
                    }

                    @Override
                    public void onPageLoaded(WebView view) {
                        layout.setRefreshing(false);
                    }
                }
            );

        // The page draws under the status bar; the spinner comes out below it.
        int start = layout.getProgressViewStartOffset();
        int end = layout.getProgressViewEndOffset();
        ViewCompat.setOnApplyWindowInsetsListener(layout, (view, insets) -> {
            int top = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;
            layout.setProgressViewOffset(false, start + top, end + top);
            return insets;
        });
    }

    @PluginMethod
    public void allow(PluginCall call) {
        allowed = call.getBoolean("allowed", true);
        pageAnswers = true;
        call.resolve();
    }
}
