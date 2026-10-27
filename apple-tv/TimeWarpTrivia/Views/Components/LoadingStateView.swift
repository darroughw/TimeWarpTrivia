import SwiftUI

// Direct port of components/shared/LoadingState.tsx: a single centered
// message.
struct LoadingStateView: View {
    let message: String

    var body: some View {
        Text(message)
            .font(TWTFont.body(24))
            .foregroundStyle(TWTColor.textLo)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
