import SwiftUI
import UIKit

@main
struct TimeWarpTriviaApp: App {
    // Owned at the app root and injected via .environmentObject — every
    // screen reads its published state directly, no per-screen view
    // models. See GameFlowViewModel's doc comment.
    @StateObject private var flow = GameFlowViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(flow)
                .ignoresSafeArea()
                // A shared-display game screen going to sleep mid-lobby
                // or mid-question is a much worse failure than a phone/
                // laptop screen timing out — same reasoning the old
                // WebViewController.swift had for isIdleTimerDisabled.
                .onAppear {
                    UIApplication.shared.isIdleTimerDisabled = true
                    #if DEBUG
                    // See GameFlowViewModel.loadDemo — launch arguments
                    // land in UserDefaults' argument domain.
                    if let screen = UserDefaults.standard.string(forKey: "demoScreen") {
                        let decade = UserDefaults.standard.string(forKey: "demoDecade").flatMap(DecadeId.init(rawValue:)) ?? .all
                        flow.loadDemo(screen: screen, decade: decade)
                    }
                    #endif
                }
        }
    }
}
