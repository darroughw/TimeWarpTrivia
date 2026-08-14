package com.timewarptrivia.tv

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * The whole app: one full-screen WebView pointed at the web app's own
 * Android TV entry point (TIM-10). No native UI, no offline mode, no
 * settings screen — every actual screen (lobby, question, scoreboard,
 * end game, help) is the same web app real browsers hit, already built
 * D-pad-first (see the main project's hooks/useDpadNavigation.ts and the
 * TIM-26 scroll-audit pass that made every TV screen fit 100vh without
 * scrolling). This class exists only to get a WebView on screen, keep
 * it awake, keep D-pad input flowing into it, and behave like a normal
 * Android TV app for the home screen / back button.
 */
class MainActivity : AppCompatActivity() {

    // See app/tv/page.tsx in the main Next.js project — that route (not
    // /host) is the actual intro screen: a bigger logo, a one-line pitch,
    // and a Start button, instead of dropping straight into a freshly
    // created, playerless /host room with no explanation of what just
    // launched.
    private val appUrl = "https://www.timewarptrivia.com/tv"

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // A shared-display game screen going to sleep mid-lobby or
        // mid-question is a much worse failure than a phone/laptop
        // screen timing out — there's no "wake it back up" for whoever's
        // holding the remote once the room's mid-game.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
        }

        // Keep navigation inside this WebView. Without an explicit
        // WebViewClient, some WebView implementations hand URL loads —
        // even same-origin ones — off to an external browser intent
        // instead of loading them in place.
        webView.webViewClient = object : WebViewClient() {}

        // D-pad key events reach web content as ordinary ArrowUp/Down/
        // Left/Right keydown events once the WebView itself has Android
        // focus. (Verified against Chromium's own input-dev notes:
        // WebView does *not* reliably do automatic spatial navigation on
        // its own, but it does forward DPAD_* KeyEvents as standard DOM
        // keydown events — see the useDpadNavigation hook on the web side
        // for what actually moves focus once those events land.) Without
        // requestFocus() here, the very first D-pad press after launch
        // can be swallowed by the Activity instead of reaching the page.
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true
        webView.requestFocus()

        webView.loadUrl(appUrl)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                    return
                }
                // Nothing to go back to — we're already at /tv, the app's
                // own entry point. Defer to the system's default behavior
                // (send the app to the background) instead of doing
                // nothing, same as any other app's root screen.
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
            }
        })
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
