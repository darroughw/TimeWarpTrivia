package com.timewarptrivia.tv

import android.annotation.SuppressLint
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * The whole app: one full-screen WebView pointed at the web app's own
 * Android TV entry point (TIM-10), plus a native error screen for when
 * that WebView can't load anything at all. No native UI otherwise, no
 * settings screen — every actual game screen (lobby, question,
 * scoreboard, end game, help) is the same web app real browsers hit,
 * already built D-pad-first (see the main project's
 * hooks/useDpadNavigation.ts and the TIM-26 scroll-audit pass that made
 * every TV screen fit 100vh without scrolling). This class exists only
 * to get a WebView on screen, keep it awake, keep D-pad input flowing
 * into it, cover the "can't reach the server" case, and behave like a
 * normal Android TV app for the home screen / back button.
 */
class MainActivity : AppCompatActivity() {

    // See app/tv/page.tsx in the main Next.js project — that route (not
    // /host) is the actual intro screen: a bigger logo, a one-line pitch,
    // and a Start button, instead of dropping straight into a freshly
    // created, playerless /host room with no explanation of what just
    // launched.
    private val appUrl = "https://www.timewarptrivia.com/tv"

    private lateinit var webView: WebView
    private lateinit var errorView: View
    private lateinit var retryButton: Button

    // Set on any main-frame load failure, cleared on retry. Guards
    // onPageFinished, which still fires (with the failed URL) after an
    // error — without this flag that callback would immediately hide the
    // error screen it was just asked to show.
    private var hasError = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // A shared-display game screen going to sleep mid-lobby or
        // mid-question is a much worse failure than a phone/laptop
        // screen timing out — there's no "wake it back up" for whoever's
        // holding the remote once the room's mid-game.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                // Without these two, WebView ignores the page's own
                // <meta name="viewport"> and renders against its own
                // internal default (narrow) virtual viewport, then
                // stretches that render to fill the real TV-sized
                // surface — every rem/vw/vh-sized element balloons and
                // content past the fold (yes, WebViews have a fold)
                // never gets seen. useWideViewPort makes WebView respect
                // the page's actual viewport meta tag; loadWithOverviewMode
                // makes it load already zoomed to fit that width instead
                // of needing a pinch-zoom-out that a D-pad can't do anyway.
                useWideViewPort = true
                loadWithOverviewMode = true
            }
            webViewClient = buildWebViewClient()

            // D-pad key events reach web content as ordinary ArrowUp/Down/
            // Left/Right keydown events once the WebView itself has
            // Android focus. (Verified against Chromium's own input-dev
            // notes: WebView does *not* reliably do automatic spatial
            // navigation on its own, but it does forward DPAD_* KeyEvents
            // as standard DOM keydown events — see useDpadNavigation on
            // the web side for what actually moves focus once those
            // events land.) Without requestFocus() below, the very first
            // D-pad press after launch can be swallowed by the Activity
            // instead of reaching the page.
            isFocusable = true
            isFocusableInTouchMode = true
        }

        errorView = buildErrorView()
        errorView.visibility = View.GONE

        fun matchParent() = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        )
        val root = FrameLayout(this).apply {
            addView(webView, matchParent())
            addView(errorView, matchParent())
        }
        setContentView(root)

        webView.loadUrl(appUrl)
        webView.requestFocus()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!hasError && webView.canGoBack()) {
                    webView.goBack()
                    return
                }
                // Nothing to go back to — we're already at /tv (or
                // showing the error screen for it), the app's own entry
                // point. Defer to the system's default behavior (send
                // the app to the background) instead of doing nothing,
                // same as any other app's root screen.
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
            }
        })
    }

    private fun buildWebViewClient() = object : WebViewClient() {
        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (request.isForMainFrame) showError()
        }

        @Suppress("OverridingDeprecatedMember", "DEPRECATION", "OVERRIDE_DEPRECATION")
        override fun onReceivedError(view: WebView, errorCode: Int, description: String?, failingUrl: String?) {
            // Only reached on API < 23, where the WebResourceRequest
            // overload above doesn't exist yet. Android TV devices are
            // overwhelmingly API 23+ in practice, but minSdk here is 21.
            showError()
        }

        override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse) {
            if (request.isForMainFrame && errorResponse.statusCode >= 400) showError()
        }

        override fun onPageFinished(view: WebView, url: String?) {
            if (!hasError) {
                errorView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }
        }
    }

    private fun showError() {
        hasError = true
        webView.visibility = View.INVISIBLE
        errorView.visibility = View.VISIBLE
        retryButton.requestFocus()
    }

    private fun retry() {
        hasError = false
        errorView.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.requestFocus()
        webView.loadUrl(appUrl)
    }

    /** dp -> px, since raw setPadding()/layout math below is in px. */
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun buildErrorView(): View {
        val voidBg = ContextCompat.getColor(this, R.color.void_bg)
        val marigold = ContextCompat.getColor(this, R.color.marigold)
        val white = ContextCompat.getColor(this, android.R.color.white)

        val title = TextView(this).apply {
            text = getString(R.string.error_title)
            setTextColor(marigold)
            textSize = 32f
            gravity = Gravity.CENTER
            setTypeface(typeface, Typeface.BOLD)
        }

        val subtitle = TextView(this).apply {
            text = getString(R.string.error_subtitle)
            setTextColor(white)
            alpha = 0.8f
            textSize = 18f
            gravity = Gravity.CENTER
            setPadding(0, dp(16), 0, dp(40))
        }

        retryButton = Button(this).apply {
            text = getString(R.string.retry_button)
            isAllCaps = false
            textSize = 18f
            setBackgroundResource(R.drawable.retry_button_background)
            setTextColor(ContextCompat.getColorStateList(this@MainActivity, R.color.retry_button_text))
            isFocusable = true
            isFocusableInTouchMode = true
            setPadding(dp(40), dp(16), dp(40), dp(16))
            setOnClickListener { retry() }
        }

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(voidBg)
            setPadding(dp(64), 0, dp(64), 0)
            addView(title)
            addView(subtitle)
            addView(
                retryButton,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ),
            )
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
