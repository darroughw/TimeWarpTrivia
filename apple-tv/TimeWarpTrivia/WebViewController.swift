import UIKit
import WebKit

/// The whole app: one full-screen WKWebView pointed at the web app's own
/// TV entry point (see `appUrl`), plus a native error screen for when
/// that WebView can't load anything at all. Direct tvOS counterpart of
/// android-tv/app/.../MainActivity.kt — same scope, same reasoning: no
/// screen is reimplemented natively, every actual game screen (lobby,
/// question, scoreboard, block, end game, help) is the same D-pad-first
/// web app real browsers hit (see the main project's
/// hooks/useDpadNavigation.ts). This class exists only to get a WebView
/// on screen, keep the TV awake, translate Siri Remote presses into the
/// keydown events that web-side code already listens for, cover the
/// "can't reach the server" case, and behave like a normal tvOS app.
final class WebViewController: UIViewController {

    // See app/tv/page.tsx in the main Next.js project — that route (not
    // /host) is the actual intro screen: a bigger logo, a one-line pitch,
    // and a Start button, instead of dropping straight into a freshly
    // created, playerless /host room with no explanation of what just
    // launched. Same URL android-tv's MainActivity.kt loads.
    private let appUrl = URL(string: "https://www.timewarptrivia.com/tv")!

    private var webView: WKWebView!
    private var errorView: UIView!
    private var retryButton: UIButton!

    // Set on any main-frame load failure, cleared on retry. Guards
    // didFinish, which can still fire for a *different* in-page
    // navigation after an error — without this flag that callback could
    // hide the error screen it was just asked to show before the retry
    // itself has actually landed.
    private var hasError = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        // A shared-display game screen going to sleep mid-lobby or
        // mid-question is a much worse failure than a phone/laptop
        // screen timing out — there's no "wake it back up" for whoever's
        // holding the remote once the room's mid-game. Direct tvOS
        // equivalent of Android's FLAG_KEEP_SCREEN_ON.
        UIApplication.shared.isIdleTimerDisabled = true

        let configuration = WKWebViewConfiguration()
        // Android sets mediaPlaybackRequiresUserGesture = false for the
        // same reason — the game's own sound effects (lib/sounds.ts) are
        // triggered from game-state changes, not always a direct tap, and
        // already tolerate a blocked first play() with a silent .catch().
        // Explicitly allowing it here avoids relying on that fallback more
        // than necessary.
        configuration.mediaTypesRequiringUserActionForPlayback = []

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        // WKWebView's own bounce/overscroll doesn't fit a 10-foot,
        // remote-driven UI the way it does a touch screen.
        webView.scrollView.bounces = false

        errorView = buildErrorView()
        errorView.translatesAutoresizingMaskIntoConstraints = false
        errorView.isHidden = true

        view.addSubview(webView)
        view.addSubview(errorView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            errorView.topAnchor.constraint(equalTo: view.topAnchor),
            errorView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            errorView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            errorView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        webView.load(URLRequest(url: appUrl))
    }

    // MARK: - Siri Remote -> DOM keydown bridge
    //
    // This is the one piece with no Android equivalent needed: Android's
    // WebView forwards D-pad KeyEvents as ordinary DOM keydown events on
    // its own (see MainActivity.kt's comment on that), so
    // useDpadNavigation.ts's `container.addEventListener("keydown", ...)`
    // just works once the WebView has focus. WKWebView on tvOS does not
    // do this automatically for a touch-surface remote — Siri Remote
    // presses arrive here as UIPress events, not as anything JavaScript
    // can see. Without this bridge, every arrow-key-driven interaction in
    // the web app (DecadeFilter, RemovePlayerButton, the passive-advance
    // "press -> or Enter to continue" screens, HelpModal's focus trap)
    // would be completely unreachable from a real Apple TV remote.
    //
    // The fix: intercept presses here and inject a real KeyboardEvent into
    // the page via JavaScript, dispatched on document.activeElement so it
    // bubbles up through exactly the same ancestor chain a genuine
    // browser-native keydown would — which is what both
    // useDpadNavigation's container-scoped listeners and the flow
    // controllers' `window.addEventListener("keydown", ...)` passive-
    // advance listeners expect.
    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
        var handled = false
        for press in presses {
            guard let key = Self.domKey(for: press.type) else { continue }
            dispatchKeydown(key)
            handled = true
        }
        // The Menu button is deliberately not mapped to a DOM key — same
        // "defer to the system" fallback as Android's back-button handler
        // when there's nowhere in-app left to go. tvOS's own Menu handling
        // (backgrounding/exiting the app) applies unchanged.
        if !handled {
            super.pressesBegan(presses, with: event)
        }
    }

    private static func domKey(for type: UIPress.PressType) -> String? {
        switch type {
        case .upArrow: return "ArrowUp"
        case .downArrow: return "ArrowDown"
        case .leftArrow: return "ArrowLeft"
        case .rightArrow: return "ArrowRight"
        // Enter, not just a synthesized click — the flow controllers'
        // passive-advance listeners (e.g. LiveTvFlow's "Press -> or Enter
        // to continue") check `event.key === "Enter"` directly. A real
        // keydown with key: "Enter" on a focused <button> also triggers
        // that button's default click action on its own, per the HTML
        // spec, so this covers both cases without a separate .click() call.
        case .select: return "Enter"
        default: return nil
        }
    }

    private func dispatchKeydown(_ key: String) {
        // JSON-encode key so it's safely quoted whether it's "ArrowUp" or
        // "Enter" — cheap insurance against ever adding a key value here
        // that needs escaping.
        guard let keyData = try? JSONSerialization.data(withJSONObject: [key]),
              let keyJson = String(data: keyData, encoding: .utf8)?.dropFirst().dropLast() else {
            return
        }
        let script = """
        (function () {
          var key = \(keyJson);
          var target = document.activeElement || document.body;
          var event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true,
          });
          target.dispatchEvent(event);
        })();
        """
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    // MARK: - Error state

    private func showError() {
        hasError = true
        webView.isHidden = true
        errorView.isHidden = false
        setNeedsFocusUpdate()
        updateFocusIfNeeded()
    }

    @objc private func retry() {
        hasError = false
        errorView.isHidden = true
        webView.isHidden = false
        webView.load(URLRequest(url: appUrl))
        setNeedsFocusUpdate()
        updateFocusIfNeeded()
    }

    // tvOS's focus engine, not requestFocus() — UIButton is focusable by
    // default on tvOS, so returning it here (plus the setNeedsFocusUpdate/
    // updateFocusIfNeeded calls in showError/retry) is what actually
    // autofocuses it once errorView stops being hidden.
    override var preferredFocusEnvironments: [UIFocusEnvironment] {
        if !errorView.isHidden {
            return [retryButton]
        }
        return [webView]
    }

    private func buildErrorView() -> UIView {
        // Matches android-tv's error screen: void background, marigold
        // title, a single autofocused Retry button — see that project's
        // README ("Offline/error state") for the same reasoning. Colors
        // are the same broadcast-void palette's hex values
        // (app/styles/_theme.scss's $void/$marigold) rather than importing
        // that file, since there's no shared token pipeline across the
        // Next.js and Swift toolchains.
        let voidBg = UIColor(red: 0x0B / 255, green: 0x0E / 255, blue: 0x1A / 255, alpha: 1)
        let marigold = UIColor(red: 0xFF / 255, green: 0xB2 / 255, blue: 0x38 / 255, alpha: 1)

        let title = UILabel()
        title.text = "Lost the signal"
        title.textColor = marigold
        title.font = .boldSystemFont(ofSize: 48)
        title.textAlignment = .center

        let subtitle = UILabel()
        subtitle.text = "Couldn't reach TimeWarp Trivia. Check the connection and try again."
        subtitle.textColor = .white
        subtitle.alpha = 0.8
        subtitle.font = .systemFont(ofSize: 28)
        subtitle.textAlignment = .center
        subtitle.numberOfLines = 0

        retryButton = UIButton(type: .system)
        retryButton.setTitle("Retry", for: .normal)
        retryButton.titleLabel?.font = .systemFont(ofSize: 28, weight: .semibold)
        retryButton.backgroundColor = marigold
        retryButton.setTitleColor(voidBg, for: .normal)
        retryButton.layer.cornerRadius = 16
        retryButton.contentEdgeInsets = UIEdgeInsets(top: 16, left: 40, bottom: 16, right: 40)
        retryButton.addTarget(self, action: #selector(retry), for: .primaryActionTriggered)

        let stack = UIStackView(arrangedSubviews: [title, subtitle, retryButton])
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 24
        stack.translatesAutoresizingMaskIntoConstraints = false

        let container = UIView()
        container.backgroundColor = voidBg
        container.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            stack.widthAnchor.constraint(lessThanOrEqualTo: container.widthAnchor, multiplier: 0.7),
        ])
        return container
    }
}

extension WebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showError()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showError()
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationResponse: WKNavigationResponse,
        decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
    ) {
        // Mirrors android-tv's onReceivedHttpError(statusCode >= 400) —
        // a 4xx/5xx on /tv itself should show the error screen just like
        // a network failure, not render whatever error page the server
        // sent back.
        if let httpResponse = navigationResponse.response as? HTTPURLResponse,
           httpResponse.statusCode >= 400,
           navigationResponse.isForMainFrame {
            showError()
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if !hasError {
            errorView.isHidden = true
            webView.isHidden = false
            setNeedsFocusUpdate()
            updateFocusIfNeeded()
        }
    }
}
