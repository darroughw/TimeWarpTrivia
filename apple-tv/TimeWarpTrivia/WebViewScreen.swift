import SwiftUI

/// SwiftUI bridge for WebViewController — kept as a UIKit view controller
/// (not a SwiftUI-native WKWebView wrapper) specifically because the
/// Siri Remote -> DOM keydown bridge needs UIResponder's
/// pressesBegan(_:with:), which isn't exposed to a plain SwiftUI View.
struct WebViewScreen: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> WebViewController {
        WebViewController()
    }

    func updateUIViewController(_ uiViewController: WebViewController, context: Context) {
        // No SwiftUI-driven state to push down — the whole screen is
        // self-contained, same as android-tv's single Activity.
    }
}
