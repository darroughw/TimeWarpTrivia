import SwiftUI

// The one backdrop behind every screen — RootView draws it once, beneath
// the screen switch, so it keeps drifting across screen changes instead of
// restarting on each one. Layers, bottom to top:
//   1. the void base color
//   2. slow-drifting color glows, tinted by the decade accent
//   3. the decade's signature motif (_decade-themes.scss's body::before),
//      in the sky above the horizon
//   4. a synthwave neon grid floor rolling toward the viewer
//   5. CRT scanlines plus the slow sweep band (the scanline-overlay mixin)
// Only offsets animate, and the motif/grid/scanlines are static Canvas
// drawings, so this stays cheap even on the A8 Apple TV HD.
struct TWTBackground: View {
    let decade: DecadeId?
    // Deep Cuts' darker, purple variant: near-black violet base, purple
    // glows, and no decade motif.
    var isDeepCuts = false

    @Environment(\.twtAccent) private var accent
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // The three drifting glows, in this theme's colors.
    private var glowColors: [Color] {
        isDeepCuts
            ? [accent.opacity(0.22), Color(hex: 0x6A2BD9).opacity(0.28), Color(hex: 0x3B1678).opacity(0.3)]
            : [accent.opacity(0.30), Color(hex: 0x8A5CFF).opacity(0.24), Color(hex: 0x4078FF).opacity(0.20)]
    }

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            ZStack {
                isDeepCuts ? TWTColor.deepCutsVoid : TWTColor.void

                // Rebuilt whenever the theme changes: a view mid-way
                // through a repeatForever animation kept the colors it
                // started with (the glows stayed marigold after switching
                // to Deep Cuts), so a fresh instance restarts the drift in
                // the new colors instead.
                DriftingGlows(colors: glowColors, size: size, animate: !reduceMotion)
                    .id(glowColors)

                if !isDeepCuts, let decade, decade != .all {
                    // Half the web's strength — at TV size and distance
                    // the full-strength bands competed with the content.
                    // Faded out before the horizon so it reads as sky.
                    DecadeMotif(decade: decade)
                        .opacity(0.5)
                        .mask(LinearGradient(colors: [.black, .black, .clear], startPoint: .top, endPoint: .init(x: 0.5, y: Self.horizon)))
                }

                NeonGridFloor(color: accent, animate: !reduceMotion)
                    .frame(height: size.height * (1 - Self.horizon))
                    .frame(maxHeight: .infinity, alignment: .bottom)

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
    }

    // Where the grid floor meets the sky, as a fraction of screen height.
    static let horizon: CGFloat = 0.64

}

private struct DriftingGlows: View {
    let colors: [Color]
    let size: CGSize
    let animate: Bool

    @State private var drifting = false

    var body: some View {
        ZStack {
            glow(color: colors[0], diameter: size.width * 0.75)
                .offset(x: drifting ? -size.width * 0.18 : -size.width * 0.38, y: drifting ? -size.height * 0.15 : -size.height * 0.35)
                .animation(drift(22), value: drifting)
            glow(color: colors[1], diameter: size.width * 0.65)
                .offset(x: drifting ? size.width * 0.22 : size.width * 0.40, y: drifting ? size.height * 0.05 : size.height * 0.30)
                .animation(drift(28), value: drifting)
            glow(color: colors[2], diameter: size.width * 0.6)
                .offset(x: drifting ? -size.width * 0.05 : -size.width * 0.25, y: drifting ? size.height * 0.25 : size.height * 0.45)
                .animation(drift(25), value: drifting)
        }
        .onAppear {
            if animate { drifting = true }
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

// The synthwave floor: a flat square grid drawn once, tipped back in 3D
// so it recedes to the horizon, and slid one cell toward the viewer on a
// loop — the classic endless-road effect, done as a compositor-only
// offset animation rather than per-frame drawing.
private struct NeonGridFloor: View {
    let color: Color
    let animate: Bool

    private static let cell: CGFloat = 120
    @State private var rolling = false

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            // Oversized so the tilted plane still covers the full width
            // and depth after the perspective squeeze.
            let planeWidth = size.width * 4
            let planeHeight = size.height * 5
            ZStack(alignment: .top) {
                Group {
                Canvas { context, canvasSize in
                    var lines = Path()
                    for x in stride(from: 0, through: canvasSize.width, by: Self.cell) {
                        lines.addRect(CGRect(x: x - 1.5, y: 0, width: 3, height: canvasSize.height))
                    }
                    for y in stride(from: 0, through: canvasSize.height, by: Self.cell) {
                        lines.addRect(CGRect(x: 0, y: y - 1.5, width: canvasSize.width, height: 3))
                    }
                    context.fill(lines, with: .color(color.opacity(0.85)))
                }
                .frame(width: planeWidth, height: planeHeight + Self.cell)
                .offset(y: rolling ? 0 : -Self.cell)
                .animation(animate ? .linear(duration: 1.6).repeatForever(autoreverses: false) : nil, value: rolling)
                .frame(width: planeWidth, height: planeHeight, alignment: .top)
                .clipped()
                .rotation3DEffect(.degrees(68), axis: (x: 1, y: 0, z: 0), anchor: .top, perspective: 1)
                .frame(width: size.width, height: size.height, alignment: .top)
                }
                .frame(width: size.width, height: size.height, alignment: .top)
                .clipped()
                // Fade the far rows into the haze at the horizon.
                .mask(LinearGradient(stops: [.init(color: .clear, location: 0), .init(color: .black, location: 0.45)], startPoint: .top, endPoint: .bottom))
                .opacity(0.7)

                // Glowing horizon line, outside the fade so it stays crisp.
                LinearGradient(colors: [.clear, color, .clear], startPoint: .leading, endPoint: .trailing)
                    .frame(height: 3)
                    .shadow(color: color, radius: 14)
                    .opacity(0.8)
            }
            .frame(width: size.width, height: size.height, alignment: .top)
        }
        .onAppear { if animate { rolling = true } }
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
