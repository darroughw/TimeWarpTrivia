import SwiftUI

// The one backdrop behind every screen — RootView draws it once, beneath
// the screen switch, so it keeps drifting across screen changes instead of
// restarting on each one. Layers, bottom to top:
//   1. the void base color
//   2. slow-drifting color glows, tinted by the decade accent
//   3. the decade's signature motif (_decade-themes.scss's body::before)
//   4. CRT scanlines plus the slow sweep band (the scanline-overlay mixin)
// Only offsets animate, and the motif/scanlines are static Canvas
// drawings, so this stays cheap even on the A8 Apple TV HD.
struct TWTBackground: View {
    let decade: DecadeId?

    @Environment(\.twtAccent) private var accent
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var drifting = false

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            ZStack {
                TWTColor.void

                glow(color: accent.opacity(0.30), diameter: size.width * 0.75)
                    .offset(x: drifting ? -size.width * 0.18 : -size.width * 0.38, y: drifting ? -size.height * 0.15 : -size.height * 0.35)
                    .animation(drift(22), value: drifting)
                glow(color: Color(hex: 0x8A5CFF).opacity(0.24), diameter: size.width * 0.65)
                    .offset(x: drifting ? size.width * 0.22 : size.width * 0.40, y: drifting ? size.height * 0.05 : size.height * 0.30)
                    .animation(drift(28), value: drifting)
                glow(color: Color(hex: 0x4078FF).opacity(0.20), diameter: size.width * 0.6)
                    .offset(x: drifting ? -size.width * 0.05 : -size.width * 0.25, y: drifting ? size.height * 0.25 : size.height * 0.45)
                    .animation(drift(25), value: drifting)

                if let decade, decade != .all {
                    // Half the web's strength — at TV size and distance
                    // the full-strength bands competed with the content.
                    DecadeMotif(decade: decade)
                        .opacity(0.5)
                }

                Scanlines()
                if !reduceMotion {
                    ScanlineSweep(height: size.height)
                }
            }
            .frame(width: size.width, height: size.height)
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            if !reduceMotion { drifting = true }
        }
    }

    private func glow(color: Color, diameter: CGFloat) -> some View {
        Circle()
            .fill(RadialGradient(colors: [color, .clear], center: .center, startRadius: 0, endRadius: diameter / 2))
            .frame(width: diameter, height: diameter)
    }

    private func drift(_ seconds: Double) -> Animation {
        .easeInOut(duration: seconds).repeatForever(autoreverses: true)
    }
}

// Ports of each decade's body::before pattern in _decade-themes.scss, at
// the same low opacities.
private struct DecadeMotif: View {
    let decade: DecadeId

    var body: some View {
        Canvas { context, size in
            switch decade {
            case .sixties:
                // Mod polka dots, two offset grids.
                dots(context, size, spacing: 80, radius: 6, offset: 0, color: Color(hex: 0x7ED321).opacity(0.18))
                dots(context, size, spacing: 80, radius: 6, offset: 40, color: TWTColor.paper.opacity(0.10))
            case .seventies:
                // Sunburst rings anchored top-right.
                let center = CGPoint(x: size.width, y: 0)
                var radius: CGFloat = 60
                var band = 0
                while radius < size.width * 1.3 {
                    let color = band % 3 == 0 ? Color(hex: 0x4D9FFF).opacity(0.10) : band % 3 == 1 ? Color(hex: 0xFFB238).opacity(0.08) : .clear
                    let ring = Path { $0.addArc(center: center, radius: radius - 30, startAngle: .zero, endAngle: .degrees(360), clockwise: false) }
                    context.stroke(ring, with: .color(color), lineWidth: 60)
                    radius += 60
                    band += 1
                }
            case .eighties:
                stripes(context, size, angle: 135, colors: [Color(hex: 0xFF3FA4).opacity(0.16), Color(hex: 0x33D6FF).opacity(0.14), Color(hex: 0xFFE03D).opacity(0.12), .clear], band: 48)
            case .nineties:
                stripes(context, size, angle: 45, colors: [Color(hex: 0x8A6DFF).opacity(0.14), Color(hex: 0x39FF14).opacity(0.12), .clear], band: 45)
            case .twoThousands:
                var grid = Path()
                stride(from: 0, through: size.width, by: 32).forEach { x in grid.addRect(CGRect(x: x, y: 0, width: 1, height: size.height)) }
                stride(from: 0, through: size.height, by: 32).forEach { y in grid.addRect(CGRect(x: 0, y: y, width: size.width, height: 1)) }
                context.fill(grid, with: .color(Color(hex: 0x33D6FF).opacity(0.12)))
            case .twentyTens:
                dots(context, size, spacing: 48, radius: 2.5, offset: 0, color: Color(hex: 0xFF8A3D).opacity(0.16))
            case .all:
                break
            }
        }
    }

    private func dots(_ context: GraphicsContext, _ size: CGSize, spacing: CGFloat, radius: CGFloat, offset: CGFloat, color: Color) {
        var path = Path()
        for x in stride(from: offset, through: size.width + spacing, by: spacing) {
            for y in stride(from: offset, through: size.height + spacing, by: spacing) {
                path.addEllipse(in: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2))
            }
        }
        context.fill(path, with: .color(color))
    }

    // Repeating diagonal bands — repeating-linear-gradient equivalent.
    private func stripes(_ context: GraphicsContext, _ size: CGSize, angle: Double, colors: [Color], band: CGFloat) {
        var context = context
        let diagonal = sqrt(size.width * size.width + size.height * size.height)
        context.translateBy(x: size.width / 2, y: size.height / 2)
        context.rotate(by: .degrees(angle))
        var x = -diagonal / 2
        var index = 0
        while x < diagonal / 2 {
            let color = colors[index % colors.count]
            context.fill(Path(CGRect(x: x, y: -diagonal / 2, width: band, height: diagonal)), with: .color(color))
            x += band
            index += 1
        }
    }
}

private struct Scanlines: View {
    var body: some View {
        Canvas { context, size in
            var path = Path()
            for y in stride(from: 0, through: size.height, by: 3) {
                path.addRect(CGRect(x: 0, y: y, width: size.width, height: 1))
            }
            context.fill(path, with: .color(.white.opacity(0.035)))
        }
    }
}

// The 240px warm band that sweeps down the screen every 8s.
private struct ScanlineSweep: View {
    let height: CGFloat
    @State private var sweeping = false

    var body: some View {
        LinearGradient(colors: [.clear, TWTColor.marigold.opacity(0.05), .clear], startPoint: .top, endPoint: .bottom)
            .frame(height: 240)
            .frame(maxHeight: .infinity, alignment: .top)
            .offset(y: sweeping ? height + 240 : -240)
            .animation(.linear(duration: 8).repeatForever(autoreverses: false), value: sweeping)
            .onAppear { sweeping = true }
    }
}
