import SwiftUI

// Direct port of components/shared/LoadingState.tsx: a single centered
// message.
struct LoadingStateView: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.title3)
            .foregroundStyle(TWTColor.textLo)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(TWTColor.void)
    }
}
