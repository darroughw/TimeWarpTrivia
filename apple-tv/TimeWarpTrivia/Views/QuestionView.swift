import SwiftUI
import UIKit

// Direct port of components/tv/QuestionScreen.tsx (the live-flow path
// only — the mock-flow's simulated-answers branch doesn't apply here,
// this app is always Supabase-backed). Shared by both "question" and
// "soloQuestion" room statuses, exactly like the web version: `soloPlayer`
// non-nil flips it into single-answerer mode.
struct QuestionView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    let question: Question
    let soloPlayer: Player?

    @State private var secondsRemaining: Int
    @State private var hasFired = false
    @State private var lowTimeAnnouncement = ""

    init(question: Question, soloPlayer: Player?) {
        self.question = question
        self.soloPlayer = soloPlayer
        _secondsRemaining = State(initialValue: question.timeLimitSeconds)
    }

    private var effectiveTotal: Int { soloPlayer != nil ? 1 : flow.activePlayerCount }
    private var answeredCount: Int { flow.answeredCount(for: question.id) }
    private var urgent: Bool { secondsRemaining <= 5 && secondsRemaining > 0 }

    var body: some View {
        VStack(spacing: TWTSpacing.lg) {
            header
            optionsGrid
            Spacer()
            footer
        }
        .padding(TWTSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(TWTColor.void)
        // Keyed on question.id — matches useCountdown's own resetKey, so
        // moving to a new question restarts this task (and its state)
        // cleanly instead of carrying over a stale countdown.
        .task(id: question.id) {
            hasFired = false
            lowTimeAnnouncement = ""
            secondsRemaining = question.timeLimitSeconds
            while secondsRemaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                secondsRemaining -= 1
                if secondsRemaining <= 5, secondsRemaining > 0 {
                    SoundPlayer.shared.play(.tick)
                    if lowTimeAnnouncement.isEmpty {
                        lowTimeAnnouncement = "5 seconds left."
                        // AccessibilityNotification (SwiftUI) needs tvOS
                        // 17 — this target is tvOS 16, so the older UIKit
                        // announcement API is what's available.
                        UIAccessibility.post(notification: .announcement, argument: lowTimeAnnouncement)
                    }
                }
            }
            fireTimeUpOnce()
        }
        // Nobody left to wait on — don't burn the rest of the clock.
        .onChange(of: answeredCount) { _ in
            if effectiveTotal > 0, answeredCount >= effectiveTotal {
                fireTimeUpOnce()
            }
        }
        .accessibilityElement(children: .contain)
    }

    private var header: some View {
        HStack(alignment: .top, spacing: TWTSpacing.xl) {
            VStack(alignment: .leading, spacing: TWTSpacing.sm) {
                if let soloPlayer {
                    Text("⚡ Solo round: only \(soloPlayer.name) can answer")
                        .font(TWTFont.bodyBold(20))
                        .foregroundStyle(TWTColor.marigold)
                }
                Text(question.roundLabel)
                    .font(TWTFont.bodyBold(18))
                    .textCase(.uppercase)
                    .foregroundStyle(TWTColor.marigold)
                // question-heading (app/styles/_mixins.scss): Archivo
                // Bold, sentence case — deliberately NOT the Archivo
                // Black marquee-heading font every other title on this
                // screen uses. All-caps at question length loses the
                // letterform cues fast readers rely on, and Archivo
                // Black runs wide enough to force more scrolling before
                // every answer option is visible.
                Text(question.text)
                    .font(TWTFont.bodyBold(36))
                    .foregroundStyle(TWTColor.textHi)
            }
            Spacer()
            CountdownRingView(
                totalSeconds: question.timeLimitSeconds,
                secondsRemaining: secondsRemaining,
                pointsMultiplier: question.pointsMultiplier
            )
        }
    }

    private var optionsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: TWTSpacing.md) {
            ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                HStack(spacing: TWTSpacing.md) {
                    Text(OptionLetter.all[index])
                        .font(TWTFont.monoBold(24))
                        .foregroundStyle(TWTColor.marigold)
                        .frame(width: 44)
                    Text(option)
                        .font(TWTFont.body(22))
                        .foregroundStyle(TWTColor.textHi)
                    Spacer()
                }
                .padding(TWTSpacing.md)
                .background(TWTColor.voidRaised)
                .overlay(RoundedRectangle(cornerRadius: TWTRadius.md).strokeBorder(TWTColor.voidLine, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
            }
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.xs) {
            Group {
                if let soloPlayer {
                    Text(answeredCount > 0 ? "\(soloPlayer.name) has answered" : "Waiting for \(soloPlayer.name)…")
                } else {
                    Text("\(answeredCount) of \(flow.activePlayerCount) players answered")
                }
            }
            .font(TWTFont.body(17))
            .foregroundStyle(TWTColor.textLo)

            GeometryReader { geometry in
                let ratio = effectiveTotal > 0 ? Double(answeredCount) / Double(effectiveTotal) : 0
                ZStack(alignment: .leading) {
                    Capsule().fill(TWTColor.voidLine)
                    Capsule().fill(TWTColor.marigold).frame(width: geometry.size.width * ratio)
                }
            }
            .frame(height: 8)
        }
    }

    private func fireTimeUpOnce() {
        guard !hasFired else { return }
        hasFired = true
        Task { await flow.handleQuestionTimeUp() }
    }
}
