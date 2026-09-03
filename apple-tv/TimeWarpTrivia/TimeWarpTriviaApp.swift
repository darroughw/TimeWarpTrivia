import SwiftUI

@main
struct TimeWarpTriviaApp: App {
    var body: some Scene {
        WindowGroup {
            WebViewScreen()
                .ignoresSafeArea()
        }
    }
}
