import SwiftUI
import UIKit

// Direct port of components/tv/QuestionScreen.tsx (the live-flow path
// only — the mock-flow's simulated-answers branch doesn't apply here,
// this app is always Supabase-backed). Shared by both "question" and
// "soloQuestion" room statuses, exactly like the web version: `soloPlayer`
// non-nil flips it into single-answerer mode.
//
// Split into child views (header/options grid/countdown/footer) rather
// than computed properties on one struct: the per-second countdown tick
// and every Realtime answer update used to live as @State/@EnvironmentObject
// reads directly on QuestionView, so each one re-ran this struct's whole
// body — header text, the LazyVGrid of answer options, and a
// GeometryReader-based progress bar all got rebuilt once a second, for
// the full 15-20s of every question, compounding with every player's
// answer arriving independently over Realtime. None of that content
// actually depends on the tick or the answer count except the countdown
// ring and the footer text/progress bar, so only those two are now
// separate views — SwiftUI can skip re-diffing the static header/grid
// when they fire.
struct QuestionView: View {
    let question: Question
    let soloPlayer: Player?

    var body: some View {
        VStack(spacing: TWTSpacing.lg) {
            QuestionHeaderView(question: question, soloPlayer: soloPlayer)
            QuestionOptionsGrid(options: question.options)
            Spacer()
            QuestionFooterView(question: question, soloPlayer: soloPlayer)
        }
        .padding(TWTSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .overlay(UrgencyVignetteView(question: question))
        .accessibilityElement(children: .contain)
    }
}

// The coral edge pulse for the last 5 seconds. Its own view with its own
// one-shot timer — rather than reading QuestionCountdownView's per-second
// state — so it re-renders once when urgency starts, not every tick, and
// leaves the rest of the screen alone (see QuestionView's doc comment).
private struct UrgencyVignetteView: View {
    let question: Question

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var urgent = false
    @State private var pulsing = false

    var body: some View {
        RoundedRectangle(cornerRadius: 0)
            .strokeBorder(TWTColor.coral, lineWidth: 24)
            .blur(radius: 40)
            .opacity(urgent ? (pulsing ? 0.85 : 0.35) : 0)
            .animation(.easeInOut(duration: 0.3), value: urgent)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.5).repeatForever(autoreverses: true), value: pulsing)
            .ignoresSafeArea()
            .allowsHitTesting(false)
            .accessibilityHidden(true)
            .task(id: question.id) {
                urgent = false
                pulsing = false
                let lead = max(0, question.timeLimitSeconds - 5)
                try? await Task.sleep(nanoseconds: UInt64(lead) * 1_000_000_000)
                if Task.isCancelled { return }
                urgent = true
                pulsing = true
            }
    }
}

private struct QuestionHeaderView: View {
    @Environment(\.twtAccent) private var accent
    let question: Question
    let soloPlayer: Player?

    var body: some View {
        HStack(alignment: .top, spacing: TWTSpacing.xl) {
            VStack(alignment: .leading, spacing: TWTSpacing.sm) {
                if let soloPlayer {
                    Text("⚡ Solo round: only \(soloPlayer.name) can answer")
                        .font(TWTFont.bodyBold(20))
                        .foregroundStyle(accent)
                }
                Text(question.roundLabel)
                    .font(TWTFont.bodyBold(18))
                    .textCase(.uppercase)
                    .foregroundStyle(accent)
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
            QuestionCountdownView(question: question, soloPlayer: soloPlayer)
        }
    }
}

// Owns the per-second tick and the single "has the clock/everyone
// finished" trigger — the only part of this screen that's supposed to
// re-render every second.
private struct QuestionCountdownView: View {
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

    var body: some View {
        CountdownRingView(
            totalSeconds: question.timeLimitSeconds,
            secondsRemaining: secondsRemaining,
            pointsMultiplier: question.pointsMultiplier
        )
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
    }

    private func fireTimeUpOnce() {
        guard !hasFired else { return }
        hasFired = true
        Task { await flow.handleQuestionTimeUp() }
    }
}

private struct QuestionOptionsGrid: View {
    let options: [String]

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dealtIn = false

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: TWTSpacing.md) {
            ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                // Same A/B/C/D colors as the phone buttons, so players can
                // match "the blue one" at a glance between screens.
                let color = TWTColor.options[index % TWTColor.options.count]
                HStack(spacing: TWTSpacing.md) {
                    Text(OptionLetter.all[index])
                        .font(TWTFont.monoBold(24))
                        .foregroundStyle(TWTColor.ink)
                        .frame(width: 64, height: 64)
                        .background(Circle().fill(color))
                    Text(option)
                        .font(TWTFont.body(22))
                        .foregroundStyle(TWTColor.textHi)
                    Spacer()
                }
                .padding(TWTSpacing.md)
                .padding(.leading, 8)
                .frame(minHeight: 130)
                .background(color.opacity(0.12))
                .background(TWTColor.voidRaised)
                .overlay(alignment: .leading) { color.frame(width: 10) }
                .overlay(RoundedRectangle(cornerRadius: TWTRadius.md).strokeBorder(color.opacity(0.45), lineWidth: twtBorderWidth))
                .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
                .shadow(color: color.opacity(0.25), radius: 20)
                // Answers deal in one after another.
                .opacity(dealtIn ? 1 : 0)
                .offset(y: dealtIn ? 0 : 40)
                .scaleEffect(dealtIn ? 1 : 0.94)
                .animation(
                    reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.7).delay(0.15 + Double(index) * 0.1),
                    value: dealtIn
                )
            }
        }
        .onAppear { dealtIn = true }
    }
}

private struct QuestionFooterView: View {
    @Environment(\.twtAccent) private var accent
    @EnvironmentObject private var flow: GameFlowViewModel
    let question: Question
    let soloPlayer: Player?

    private var effectiveTotal: Int { soloPlayer != nil ? 1 : flow.activePlayerCount }
    private var answeredCount: Int { flow.answeredCount(for: question.id) }

    var body: some View {
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
                    Capsule().fill(accent).frame(width: geometry.size.width * ratio)
                }
            }
            .frame(height: 8)
        }
    }
}
