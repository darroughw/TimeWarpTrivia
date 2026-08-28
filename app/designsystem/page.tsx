"use client";

import { useState, type CSSProperties } from "react";
import CancelGameButton from "@/components/tv/CancelGameButton";
import CountdownRing from "@/components/tv/CountdownRing";
import DecadeFilter from "@/components/tv/DecadeFilter";
import PlayerAvatar from "@/components/tv/PlayerAvatar";
import RemovePlayerButton from "@/components/tv/RemovePlayerButton";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import FeedbackButton from "@/components/shared/FeedbackButton";
import HelpButton from "@/components/shared/HelpButton";
import ShareButton from "@/components/shared/ShareButton";
import { ALL_DECADES_OPTION, DECADE_COLORS } from "@/lib/decadeColors";
import { DEEP_CUT_TOPIC_COLORS, DEFAULT_DEEP_CUT_COLOR } from "@/lib/deepCutColors";
import { MOCK_PLAYERS } from "@/lib/mockData";
import type { Decade, DecadeId } from "@/lib/types";
import styles from "./page.module.scss";

// Not linked from anywhere in the app (landing footer, nav, etc.) and
// excluded from robots.txt/sitemap.xml — reachable only by visiting this
// URL directly. An internal/portfolio reference, not a promoted page.

const DEMO_DECADES: Decade[] = [
  { id: "60s", label: "60s" },
  { id: "70s", label: "70s" },
  { id: "80s", label: "80s" },
  { id: "90s", label: "90s" },
  { id: "2000s", label: "2000s" },
  { id: "2010s", label: "2010s" },
  ALL_DECADES_OPTION,
];

const DECADE_SWATCHES: { id: DecadeId; ratio?: string; note?: string }[] = [
  { id: "60s", ratio: "~9.65:1 vs ink" },
  { id: "70s", ratio: "~6.64:1 vs ink" },
  { id: "80s" },
  { id: "90s", ratio: "~4.91:1 vs ink", note: "Lightened from #7c5cff, which landed at 4.15:1 — just under AA." },
  { id: "2000s" },
  { id: "2010s" },
  { id: "all", note: "= $marigold. Deliberately neutral." },
];

const SPACING_SCALE = [
  { name: "xs", rem: "0.5rem", px: "8px" },
  { name: "sm", rem: "1rem", px: "16px" },
  { name: "md", rem: "1.75rem", px: "28px" },
  { name: "lg", rem: "3rem", px: "48px" },
  { name: "xl", rem: "5rem", px: "80px" },
  { name: "2xl", rem: "8rem", px: "128px" },
];

export default function DesignSystem() {
  const [selectedDecade, setSelectedDecade] = useState<DecadeId>("70s");

  return (
    <div className={styles.shell}>
      <ScanlineOverlay />

      <nav className={styles.sidebar}>
        <div className={styles.sidebarMark}>
          TIMEWARP
          <span>TRIVIA</span>
        </div>

        <div className={styles.tocGroup}>
          <span className={styles.tocLabel}>Foundations</span>
          <a href="#color">Color</a>
          <a href="#type">Typography</a>
          <a href="#spacing">Spacing &amp; Radius</a>
          <a href="#elevation">Elevation &amp; Motion</a>
        </div>

        <div className={styles.tocGroup}>
          <span className={styles.tocLabel}>Components — shipped</span>
          <a href="#buttons">Buttons</a>
          <a href="#forms">Form fields</a>
          <a href="#pills">Pills &amp; badges</a>
          <a href="#cards">Cards</a>
          <a href="#avatars">Avatars</a>
          <a href="#countdown">Countdown ring</a>
          <a href="#podium">Podium</a>
          <a href="#modals">Modals</a>
          <a href="#theming">Decade &amp; topic theming</a>
        </div>

        <div className={styles.tocGroup}>
          <span className={styles.tocLabel}>Proposed — not built</span>
          <a href="#proposed">Speculative components</a>
        </div>

        <div className={styles.tocGroup}>
          <span className={styles.tocLabel}>Reference</span>
          <a href="#principles">Usage principles</a>
        </div>
      </nav>

      <main className={styles.content}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Design System</span>
          <h1>Broadcast Void</h1>
          <p className={styles.lede}>
            A dark, CRT-glow broadcast aesthetic with warm game-show marigold as the hero accent
            — every token and component below is pulled directly from{" "}
            <code className={styles.inlineCode}>app/styles/_theme.scss</code>,{" "}
            <code className={styles.inlineCode}>_mixins.scss</code>, and the real component behind
            each shipped screen. The buttons, avatars, and countdown ring in this document{" "}
            <em>are</em> the real components, not recreations. Only the{" "}
            <a href="#proposed" style={{ color: "var(--marigold, #ffb238)" }}>
              Proposed
            </a>{" "}
            section departs from what&rsquo;s actually shipped.
          </p>
        </div>

        {/* ============================= COLOR ============================= */}
        <section id="color">
          <span className={styles.eyebrow}>01</span>
          <h2 className={styles.sectionTitle}>Color</h2>
          <p className={styles.body}>
            Six roles, not a rainbow: a dark surface stack, one hero accent, two fixed semantic
            colors that never change meaning, muted text, a cool non-themeable focus ring, and two
            open-ended accent maps (decade, Deep Cuts topic) that recolor the app per-session.
          </p>

          <h3 className={styles.subsectionTitle}>Surface</h3>
          <div className={`${styles.grid} ${styles.grid4}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$void</span>
                <span className={styles.swatchHex}>#0b0e1a</span>
                <span className={styles.swatchNote}>Base background — the &ldquo;off-air&rdquo; black every screen sits on.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void-raised, #131829)" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$void-raised</span>
                <span className={styles.swatchHex}>#131829</span>
                <span className={styles.swatchNote}>Panels, cards, modals, inputs sitting on the void.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void-line, #262c46)" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$void-line</span>
                <span className={styles.swatchHex}>#262c46</span>
                <span className={styles.swatchNote}>Hairline borders on dark surfaces.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "#f4ecd8" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$paper</span>
                <span className={styles.swatchHex}>#f4ecd8</span>
                <span className={styles.swatchNote}>Warm paper surface — podium 2nd-place tint, option-letter chip.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "#e4d9bd" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$paper-dim</span>
                <span className={styles.swatchHex}>#e4d9bd</span>
                <span className={styles.swatchNote}>Secondary paper surface / hover.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "#171425" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$ink</span>
                <span className={styles.swatchHex}>#171425</span>
                <span className={styles.swatchNote}>Near-black text on paper AND on any accent fill (marigold, decade colors).</span>
              </div>
            </div>
          </div>

          <h3 className={styles.subsectionTitle}>Accent — themeable</h3>
          <p className={styles.body}>
            Routed through a CSS custom property with the base hex as fallback (
            <code className={styles.inlineCode}>var(--marigold, #ffb238)</code>), so a decade
            theme can override it at runtime once a decade&rsquo;s picked in the lobby, with zero
            component changes.
          </p>
          <div className={`${styles.grid} ${styles.grid4}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--marigold, #ffb238)" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$marigold</span>
                <span className={styles.swatchHex}>#ffb238</span>
                <span className={styles.swatchNote}>Primary accent — marquee headlines, primary CTA, focus glow source, room code.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--marigold-dim, #8a5f18)" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$marigold-dim</span>
                <span className={styles.swatchHex}>#8a5f18</span>
                <span className={styles.swatchNote}>Marigold at low emphasis — borders, dividers, hover states.</span>
              </div>
            </div>
          </div>

          <h3 className={styles.subsectionTitle}>Semantic — fixed, never themeable</h3>
          <p className={styles.body}>
            Deliberately excluded from decade theming. Letting a decade recolor &ldquo;correct
            answer&rdquo; would undermine the one piece of feedback that has to read the same in
            every session.
          </p>
          <div className={`${styles.grid} ${styles.grid4}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "#ff5a5f" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$coral</span>
                <span className={styles.swatchHex}>#ff5a5f</span>
                <span className={styles.swatchNote}>Wrong answer, urgent countdown (&le;5s), last-place block state.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "#2dd4bf" }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$teal</span>
                <span className={styles.swatchHex}>#2dd4bf</span>
                <span className={styles.swatchNote}>Correct answer, success, points earned.</span>
              </div>
            </div>
          </div>

          <h3 className={styles.subsectionTitle}>Text &amp; focus</h3>
          <div className={`${styles.grid} ${styles.grid4}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)", color: "#fbf6ec", fontWeight: 700 }}>Aa</div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$text-hi</span>
                <span className={styles.swatchHex}>#fbf6ec</span>
                <span className={styles.swatchNote}>Primary text on void.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)", color: "#a7abc4", fontWeight: 700 }}>Aa</div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$text-lo</span>
                <span className={styles.swatchHex}>#a7abc4</span>
                <span className={styles.swatchNote}>Secondary / muted text, captions, labels.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)", color: "#666b87", fontWeight: 700 }}>Aa</div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$text-placeholder</span>
                <span className={styles.swatchHex}>#666b87</span>
                <span className={styles.swatchNote}>Form placeholders — dim enough not to read as already filled in.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", border: "3px solid #8fd3ff", boxShadow: "0 0 0 4px rgba(143,211,255,0.35)" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$focus-ring-color</span>
                <span className={styles.swatchHex}>#8fd3ff</span>
                <span className={styles.swatchNote}>
                  The &ldquo;remote cursor.&rdquo; Fixed and non-themeable — kept visually distinct
                  from marigold&rsquo;s &ldquo;selected&rdquo; fill so a focused-but-unselected pill
                  never reads as chosen.
                </span>
              </div>
            </div>
          </div>

          <h3 className={styles.subsectionTitle}>Decade accents</h3>
          <p className={styles.body}>
            One hue per playable decade, each pre-checked against <code className={styles.inlineCode}>$ink</code> text
            at the WCAG AA 4.5:1 floor. <code className={styles.inlineCode}>all</code> stays neutral marigold — a
            session spanning every era reads as &ldquo;no era,&rdquo; not a seventh color.
          </p>
          <div className={`${styles.grid} ${styles.grid4}`}>
            {DECADE_SWATCHES.map((d) => (
              <div className={styles.swatch} key={d.id}>
                <div className={styles.swatchFill} style={{ background: DECADE_COLORS[d.id] }} />
                <div className={styles.swatchBody}>
                  <span className={styles.swatchName}>{d.id}</span>
                  <span className={styles.swatchHex}>{DECADE_COLORS[d.id]}</span>
                  {d.ratio && <span className={styles.swatchRatio}>{d.ratio}</span>}
                  {d.note && <span className={styles.swatchNote}>{d.note}</span>}
                </div>
              </div>
            ))}
          </div>

          <h3 className={styles.subsectionTitle}>Deep Cuts topic accents</h3>
          <p className={styles.body}>
            Same role as decade colors, but an open <code className={styles.inlineCode}>Record&lt;string, string&gt;</code> rather
            than a closed union — a new topic is a data change, not a code change.
          </p>
          <div className={`${styles.grid} ${styles.grid3}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: DEEP_CUT_TOPIC_COLORS["west-wing"] }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>west-wing</span>
                <span className={styles.swatchHex}>{DEEP_CUT_TOPIC_COLORS["west-wing"]}</span>
                <span className={styles.swatchRatio}>~7.46:1 vs ink</span>
                <span className={styles.swatchNote}>Presidential gold.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: DEEP_CUT_TOPIC_COLORS.fallout }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>fallout</span>
                <span className={styles.swatchHex}>{DEEP_CUT_TOPIC_COLORS.fallout}</span>
                <span className={styles.swatchRatio}>~13.32:1 vs ink</span>
                <span className={styles.swatchNote}>Pip-Boy terminal green.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: DEFAULT_DEEP_CUT_COLOR }} />
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>default</span>
                <span className={styles.swatchHex}>{DEFAULT_DEEP_CUT_COLOR}</span>
                <span className={styles.swatchNote}>Fallback for a topic with no entry yet.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= TYPE ============================= */}
        <section id="type">
          <span className={styles.eyebrow}>02</span>
          <h2 className={styles.sectionTitle}>Typography</h2>
          <p className={styles.body}>Three families, three jobs — no overlap, no fourth face creeping in.</p>

          <div className={`${styles.grid} ${styles.grid3}`}>
            <div className={`${styles.swatch} ${styles.specimen}`}>
              <div className={styles.specimenHead}>
                Nostalgia,
                <br />
                <span>weaponized.</span>
              </div>
              <div className={styles.swatchBody} style={{ padding: 0, marginTop: "1rem" }}>
                <span className={styles.swatchName}>$head-font — Archivo Black</span>
                <span className={styles.swatchNote}>
                  Marquee headlines only, via <code className={styles.inlineCode}>marquee-heading</code>: uppercase,
                  0.02em tracking, 0.95 line-height.
                </span>
              </div>
            </div>
            <div className={`${styles.swatch} ${styles.specimen}`}>
              <div className={styles.specimenBody}>
                In 1997, what did you have to do to keep a Tamagotchi from &ldquo;dying&rdquo;?
              </div>
              <div className={styles.swatchBody} style={{ padding: 0, marginTop: "1rem" }}>
                <span className={styles.swatchName}>$paper-font — Archivo</span>
                <span className={styles.swatchNote}>
                  Body copy and, via <code className={styles.inlineCode}>question-heading</code>, actual trivia
                  question text — sentence case, not all-caps, so long questions keep letterform
                  cues fast readers rely on (TIM-36).
                </span>
              </div>
            </div>
            <div className={`${styles.swatch} ${styles.specimen}`}>
              <div className={styles.specimenMono}>WARP-72</div>
              <div className={styles.swatchBody} style={{ padding: 0, marginTop: "1rem" }}>
                <span className={styles.swatchName}>$mono-font — Space Mono</span>
                <span className={styles.swatchNote}>
                  Timers, scores, room codes — anywhere digits need to line up, via the{" "}
                  <code className={styles.inlineCode}>mono-figure</code> mixin (
                  <code className={styles.inlineCode}>tabular-nums</code>).
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= SPACING ============================= */}
        <section id="spacing">
          <span className={styles.eyebrow}>03</span>
          <h2 className={styles.sectionTitle}>Spacing &amp; radius</h2>
          <p className={styles.body}>A 10-foot-UI spacing scale — generous, legible from a couch, not a dense 4px web grid.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: "32rem", marginTop: "1.5rem" }}>
            {SPACING_SCALE.map((s) => (
              <div className={styles.spaceRow} key={s.name}>
                <code className={`${styles.inlineCode} ${styles.spaceLabel}`}>{s.name}</code>
                <div className={styles.spaceBar} style={{ width: s.rem }} />
                <span className={styles.swatchHex}>
                  {s.rem} / {s.px}
                </span>
              </div>
            ))}
          </div>

          <h3 className={styles.subsectionTitle}>Radius &amp; border</h3>
          <div className={`${styles.grid} ${styles.grid4}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "4rem", height: "4rem", background: "var(--void-raised, #131829)", border: "2px solid var(--marigold-dim, #8a5f18)", borderRadius: "0.5rem" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$radius-sm</span>
                <span className={styles.swatchHex}>0.5rem</span>
                <span className={styles.swatchNote}>Tags, small chips, inline notices.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "4rem", height: "4rem", background: "var(--void-raised, #131829)", border: "2px solid var(--marigold-dim, #8a5f18)", borderRadius: "1rem" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$radius-md</span>
                <span className={styles.swatchHex}>1rem</span>
                <span className={styles.swatchNote}>Cards, inputs, question options.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "4rem", height: "4rem", background: "var(--void-raised, #131829)", border: "2px solid var(--marigold-dim, #8a5f18)", borderRadius: "1.75rem" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$radius-lg</span>
                <span className={styles.swatchHex}>1.75rem</span>
                <span className={styles.swatchNote}>Buttons, pills, modal dialogs.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "4rem", height: "1.5rem", marginTop: "1.25rem", borderTop: "3px solid var(--marigold-dim, #8a5f18)" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>$border-width</span>
                <span className={styles.swatchHex}>3px</span>
                <span className={styles.swatchNote}>The one border weight almost every component uses.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= ELEVATION ============================= */}
        <section id="elevation">
          <span className={styles.eyebrow}>04</span>
          <h2 className={styles.sectionTitle}>Elevation &amp; motion</h2>
          <p className={styles.body}>
            No drop shadows in the conventional sense — elevation here means a colored glow, and
            motion means the CRT signature sweep plus two focus/press treatments split by input
            method.
          </p>

          <h3 className={styles.subsectionTitle}>Glow</h3>
          <div className={`${styles.grid} ${styles.grid4}`}>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "var(--marigold, #ffb238)", boxShadow: "var(--shadow-glow-marigold, 0 0 40px rgba(255,178,56,.35))" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>glow-marigold</span>
                <span className={styles.swatchNote}>Primary CTAs, the active countdown ring.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "#8fd3ff", boxShadow: "0 0 32px rgba(143, 211, 255, 0.4)" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>glow-focus</span>
                <span className={styles.swatchNote}>D-pad focus ring.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "#2dd4bf", boxShadow: "0 0 40px rgba(45, 212, 191, 0.35)" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>glow-teal</span>
                <span className={styles.swatchNote}>Correct-answer / success moments.</span>
              </div>
            </div>
            <div className={styles.swatch}>
              <div className={styles.swatchFill} style={{ background: "var(--void, #0b0e1a)" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "#ff5a5f", boxShadow: "0 0 40px rgba(255, 90, 95, 0.35)" }} />
              </div>
              <div className={styles.swatchBody}>
                <span className={styles.swatchName}>glow-coral</span>
                <span className={styles.swatchNote}>Block/last-place, urgent countdown.</span>
              </div>
            </div>
          </div>

          <h3 className={styles.subsectionTitle}>Motion</h3>
          <div className={styles.demoStage}>
            <button className={styles.btnPrimary}>Tab to me</button>
            <span className={styles.swatchNote} style={{ maxWidth: "20rem" }}>
              <strong style={{ color: "var(--text-hi, #fbf6ec)" }}>dpad-focusable</strong> — TV routes. Border →
              focus-ring, glow ring, <code className={styles.inlineCode}>translateY(-2px)</code>. No default browser
              outline.
            </span>
          </div>
          <div className={styles.demoStage} style={{ marginTop: "0.75rem" }}>
            <button className={styles.btnPrimary}>Press me</button>
            <span className={styles.swatchNote} style={{ maxWidth: "20rem" }}>
              <strong style={{ color: "var(--text-hi, #fbf6ec)" }}>tappable</strong> — phone routes.{" "}
              <code className={styles.inlineCode}>scale(0.97)</code> on <code className={styles.inlineCode}>:active</code>,
              44px+ touch target guaranteed, no tap-highlight flash.
            </span>
          </div>
          <p className={styles.demoCaption}>
            Ambient scanline sweep (visible across this whole page) respects{" "}
            <code className={styles.inlineCode}>prefers-reduced-motion</code> everywhere it&rsquo;s used.
          </p>
        </section>

        <hr className={styles.rule} />

        {/* ============================= BUTTONS ============================= */}
        <section id="buttons">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Buttons</h2>
          <div className={styles.demoStage}>
            <button className={styles.btnPrimary}>Host a Game</button>
            <button className={styles.btnPrimary} disabled>
              Join Game
            </button>
            <button className={styles.btnOutline}>Join a Game</button>
            <button className={styles.btnPill}>Privacy Policy</button>
            <HelpButton />
            <FeedbackButton />
            <ShareButton />
            <RemovePlayerButton playerName="Neon Dad" onConfirm={() => {}} />
            <CancelGameButton onConfirm={() => {}} />
          </div>
          <p className={styles.demoCaption}>
            Primary (marigold, glow) &middot; disabled (0.4 opacity, glow removed) &middot; outline
            (secondary CTA) &middot; pill (footer text link) &middot; Help/Feedback/Share are the
            real tertiary icon+label components, fully functional &mdash; Help opens the real modal
            &middot; Remove Player / Cancel Game are the real arm-then-confirm buttons (TIM-35/38),
            click once to arm.
          </p>
        </section>

        {/* ============================= FORMS ============================= */}
        <section id="forms">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Form fields</h2>
          <div className={styles.demoStage} style={{ alignItems: "flex-start" }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Room Code</label>
              <input className={`${styles.fieldInput} mono`} placeholder="WARP-72" readOnly />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Display Name</label>
              <input className={styles.fieldInput} placeholder="What should we call you?" readOnly />
              <span className={styles.fieldError}>That name&rsquo;s taken in this room.</span>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Feedback</label>
              <textarea className={styles.fieldTextarea} placeholder="A topic you'd want, a bug, anything." readOnly />
            </div>
          </div>
          <p className={styles.demoCaption}>
            Mono variant for room codes (letter-spaced, tabular) &middot; paper-font for names/free
            text &middot; focus border always <code className={styles.inlineCode}>$marigold</code>,
            never the focus-ring blue (that&rsquo;s reserved for D-pad navigation) &middot; error
            text always <code className={styles.inlineCode}>$coral</code>.
          </p>
        </section>

        {/* ============================= PILLS ============================= */}
        <section id="pills">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Pills &amp; badges</h2>

          <h3 className={styles.subsectionTitle}>Decade filter</h3>
          <div style={{ marginTop: "0.75rem" }}>
            <DecadeFilter decades={DEMO_DECADES} selectedId={selectedDecade} onSelect={setSelectedDecade} />
          </div>
          <p className={styles.demoCaption}>
            The real component &mdash; click a pill. Unselected: void-raised fill, muted text.
            Selected: fills with that decade&rsquo;s own accent color, <code className={styles.inlineCode}>$ink</code>{" "}
            text.
          </p>

          <h3 className={styles.subsectionTitle}>Tags &amp; status badges</h3>
          <div className={styles.demoStage}>
            <span className={styles.tagChip} style={{ "--chip-c": DECADE_COLORS["90s"] } as CSSProperties}>
              90s
            </span>
            <span className={styles.tagChip} style={{ "--chip-c": DEEP_CUT_TOPIC_COLORS.fallout } as CSSProperties}>
              Fallout
            </span>
            <span className={styles.badgeOutline}>Last Place</span>
          </div>
          <p className={styles.demoCaption}>
            Filled decade/topic tag (block-candidate cards) &middot; outline status badge, coral
            (the block mechanic&rsquo;s &ldquo;you&rsquo;re up&rdquo; marker)
          </p>
        </section>

        {/* ============================= CARDS ============================= */}
        <section id="cards">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Cards</h2>

          <h3 className={styles.subsectionTitle}>Question card + answer options</h3>
          <div className={styles.demoStage} style={{ alignItems: "flex-start", flexDirection: "column" }}>
            <div className={styles.qCard}>In 1997, what did you have to do to keep a Tamagotchi from &ldquo;dying&rdquo;?</div>
            <div className={styles.optionList}>
              <div className={`${styles.option} ${styles.selected}`}>
                <span className={styles.optionLetter}>A</span>
                Feed it, clean up after it, and put it to sleep on a schedule
              </div>
              <div className={styles.option}>
                <span className={styles.optionLetter}>B</span>
                Plug it into a Game Boy once a day
              </div>
            </div>
          </div>

          <h3 className={styles.subsectionTitle}>Radio-style choice card</h3>
          <div className={styles.demoStage}>
            <div className={`${styles.radioCard} ${styles.selected}`}>90s &middot; What did Tamagotchi require?</div>
            <div className={styles.radioCard}>70s &middot; What 1973 song begged a woman not to take her man?</div>
          </div>
          <p className={styles.demoCaption}>
            BlockChoiceScreen&rsquo;s <code className={styles.inlineCode}>role=&quot;radio&quot;</code> cards — the
            lowest scorer picks exactly one of three to answer alone.
          </p>
        </section>

        {/* ============================= AVATARS ============================= */}
        <section id="avatars">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Avatars</h2>
          <div className={styles.demoStage}>
            <PlayerAvatar player={MOCK_PLAYERS[0]} size="sm" />
            <PlayerAvatar player={MOCK_PLAYERS[1]} size="md" />
            <PlayerAvatar player={MOCK_PLAYERS[2]} size="lg" />
            <PlayerAvatar player={MOCK_PLAYERS[5]} size="md" showScore rank={1} />
          </div>
          <p className={styles.demoCaption}>
            The real component, real mock players. Ring color is the player&rsquo;s own assigned
            color (deterministic from name, <code className={styles.inlineCode}>lib/avatar.ts</code>), not a decade or
            topic accent. Sizes use <code className={styles.inlineCode}>clamp()</code> internally to shrink on shorter
            TV viewports, not fixed breakpoints.
          </p>
        </section>

        {/* ============================= COUNTDOWN ============================= */}
        <section id="countdown">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Countdown ring</h2>
          <div className={styles.demoStage}>
            <CountdownRing totalSeconds={20} secondsRemaining={14} />
            <CountdownRing totalSeconds={20} secondsRemaining={4} />
            <CountdownRing totalSeconds={20} secondsRemaining={17} size="sm" pointsMultiplier={2} />
          </div>
          <p className={styles.demoCaption}>
            The real component. Marigold while there&rsquo;s time left, shifts to coral at &le;5
            seconds &mdash; same SVG, just a class swap plus a live points readout that decays with
            the clock (rightmost: &ldquo;sm&rdquo; phone size, final-round 2x multiplier).
          </p>
        </section>

        {/* ============================= PODIUM ============================= */}
        <section id="podium">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Podium</h2>
          <div className={styles.podiumRow}>
            <div className={styles.podiumSpot}>
              <PlayerAvatar player={MOCK_PLAYERS[1]} size="sm" showName={false} />
              <div className={`${styles.podiumBlock} ${styles.second}`}>2</div>
            </div>
            <div className={styles.podiumSpot}>
              <PlayerAvatar player={MOCK_PLAYERS[0]} size="sm" showName={false} />
              <div className={`${styles.podiumBlock} ${styles.first}`}>1</div>
            </div>
            <div className={styles.podiumSpot}>
              <PlayerAvatar player={MOCK_PLAYERS[4]} size="sm" showName={false} />
              <div className={`${styles.podiumBlock} ${styles.third}`}>3</div>
            </div>
          </div>
          <p className={styles.demoCaption}>
            Heights and glow are relative, not just decorative — 1st is tallest and the only one
            with <code className={styles.inlineCode}>$marigold</code> + glow; 2nd uses paper, 3rd
            uses coral. 4th place and below drop to a flat ranked list beneath (not shown here).
          </p>
        </section>

        {/* ============================= MODALS ============================= */}
        <section id="modals">
          <span className={styles.eyebrow}>Component</span>
          <h2 className={styles.sectionTitle}>Modals</h2>
          <div className={styles.demoStage} style={{ background: "var(--void, #0b0e1a)", padding: "5rem 3rem", justifyContent: "center" }}>
            <div className={styles.modalFrame}>
              <div className={styles.modalClose}>&times;</div>
              <h3 className={styles.modalTitle}>Send Feedback</h3>
              <p className={styles.modalSubtitle}>A bug, a topic you want, anything.</p>
              <div className={styles.field} style={{ marginTop: "1.75rem", maxWidth: "none" }}>
                <label className={styles.fieldLabel}>
                  Message <span style={{ color: "var(--marigold, #ffb238)", textTransform: "none" }}>*</span>
                </label>
                <textarea className={styles.fieldTextarea} placeholder="What's on your mind?" readOnly />
              </div>
              <button className={styles.btnPrimary} style={{ marginTop: "1.75rem", width: "100%" }}>
                Send
              </button>
            </div>
          </div>
          <p className={styles.demoCaption}>
            Backdrop <code className={styles.inlineCode}>rgba(11,14,26,0.85)</code> over everything
            &middot; dialog border is always <code className={styles.inlineCode}>$marigold-dim</code>, regardless of
            active decade theme &middot; Tab/Shift+Tab trapped inside, focus restored to the trigger
            button on close (fixed as a real a11y bug in TIM-26). Try the real thing via the Help
            button above.
          </p>
        </section>

        {/* ============================= THEMING ============================= */}
        <section id="theming">
          <span className={styles.eyebrow}>System</span>
          <h2 className={styles.sectionTitle}>Decade &amp; topic theming</h2>
          <p className={styles.body}>
            Once a decade&rsquo;s picked, <code className={styles.inlineCode}>data-decade-theme</code> on{" "}
            <code className={styles.inlineCode}>&lt;html&gt;</code> drives{" "}
            <code className={styles.inlineCode}>_decade-themes.scss</code> to override the marigold custom properties
            plus a <code className={styles.inlineCode}>body::before</code> background motif — reactive over Realtime,
            so the TV and every phone theme identically with no extra plumbing. Deep Cuts topics
            work the same way via <code className={styles.inlineCode}>deepCutColors.ts</code>. &ldquo;All
            Decades&rdquo; and the pre-lobby screen stay on base tokens deliberately.
          </p>
          <div className={styles.themeStrip}>
            {DEMO_DECADES.map((d) => (
              <span className={styles.themeSeg} style={{ "--sc": DECADE_COLORS[d.id] } as CSSProperties} key={d.id}>
                {d.label}
              </span>
            ))}
          </div>
        </section>

        <hr className={styles.rule} />

        {/* ============================= PROPOSED ============================= */}
        <section id="proposed">
          <span className={styles.eyebrow}>05 — Speculative</span>
          <h2 className={styles.sectionTitle}>Proposed components</h2>
          <p className={styles.lede} style={{ fontSize: "1.05rem" }}>
            Not built, not in any component tree today. Each one below is grounded in something
            real — a documented limitation, a growing content set, or a natural next step for an
            existing screen — built from the same tokens so it would drop in without inventing a
            new visual language.
          </p>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Toast / inline confirmation
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pToast}>
                <span>&#10003;</span>
                <span>Room code copied.</span>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> ShareButton already has a 2-second &ldquo;Copied!&rdquo; text swap baked into
                the button itself — a real toast would generalize that pattern (player-joined pings, &ldquo;question
                skipped&rdquo; confirmations) instead of every feature reinventing its own inline state.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Status banner
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pBanner}>
                <span>&#9888;</span>
                <span>Reconnecting to the room&hellip; your answers are safe.</span>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> the README&rsquo;s own limitations list flags &ldquo;no reconnect handling&rdquo;
                for a host session — if that ever gets built, this is the persistent, non-dismissible banner it would
                need. Coral for connection-loss, marigold for lower-stakes announcements (&ldquo;new decade
                added&rdquo;).
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Category chip selector
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.demoStage} style={{ padding: 0, background: "none", border: "none" }}>
                <span className={`${styles.tagChip}`} style={{ "--chip-c": "var(--marigold, #ffb238)" } as CSSProperties}>
                  Music
                </span>
                <span className={styles.badgeOutline} style={{ color: "var(--text-lo, #a7abc4)", borderColor: "var(--void-line, #262c46)" }}>
                  Movies
                </span>
                <span className={styles.badgeOutline} style={{ color: "var(--text-lo, #a7abc4)", borderColor: "var(--void-line, #262c46)" }}>
                  TV
                </span>
                <span className={styles.badgeOutline} style={{ color: "var(--text-lo, #a7abc4)", borderColor: "var(--void-line, #262c46)" }}>
                  Fashion
                </span>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> the README documents this directly — category selection is fully random today,
                not per-round, even though <code className={styles.inlineCode}>categories</code>/
                <code className={styles.inlineCode}>min_decade_id</code> gating already exists in the schema. This is
                the missing UI half: same pill component as the decade filter, multi-select instead of single.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Accordion FAQ
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pAccordion}>
                <div className={styles.pAccordionItem}>
                  <div className={styles.pAccordionHead}>
                    Is there a mode besides picking a decade?
                    <span style={{ color: "var(--marigold, #ffb238)" }}>&#8722;</span>
                  </div>
                  <p className={styles.pAccordionBody}>Deep Cuts — the host picks one specific topic instead of an era.</p>
                </div>
                <div className={styles.pAccordionItem}>
                  <div className={styles.pAccordionHead} style={{ color: "var(--text-lo, #a7abc4)" }}>
                    Is it free?<span>&#43;</span>
                  </div>
                </div>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> the landing page&rsquo;s FAQ is flat text today (6 questions, deliberately — it
                also feeds the FAQPage JSON-LD for SEO/GEO). If it keeps growing past ~8&ndash;10 entries the flat
                list gets long to scroll; an accordion would need to keep every answer in the DOM (not conditionally
                rendered) so the structured-data parity with the JSON-LD block doesn&rsquo;t break.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Stats table
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pTable}>
                <div className={styles.pTableHead}>
                  <span>Player</span>
                  <span>Games</span>
                  <span>Best</span>
                </div>
                <div className={styles.pTableRow}>
                  <span>Cassette Ghost</span>
                  <span>12</span>
                  <span>4,120</span>
                </div>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> nothing in the app persists player identity across rooms today (fresh names
                every game) — but if a &ldquo;recognized regulars&rdquo; or cross-session leaderboard ever shipped,
                this is the tabular pattern for it: mono figures for anything numeric, hairline row dividers, no
                zebra striping (the void/void-raised split already does that job).
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Switch / toggle
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pSwitch}>
                <div className={styles.pSwitchTrack}>
                  <div className={styles.pSwitchKnob} />
                </div>
                <span>Sound effects</span>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> the block mechanic and wrong-answer moments already imply a sound design
                opportunity (TIM-13 explicitly calls for an original wrong-answer sting) — the moment audio ships, it
                needs a mute control. Track fills marigold + glow when on, matching the primary-button treatment
                rather than a generic gray switch.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Skeleton loader
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.qCard} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className={styles.pSkeletonLine} style={{ width: "90%" }} />
                <div className={styles.pSkeletonLine} style={{ width: "60%", animationDelay: "0.2s" }} />
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> today <code className={styles.inlineCode}>LoadingState</code> is a single
                full-screen message (&ldquo;Creating your room&hellip;&rdquo;) — fine for a one-time room-creation
                wait, but a shape-matched skeleton would read better for anything that loads inline without swapping
                the whole screen, like a future stats table.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Empty state
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pEmpty}>
                <div style={{ fontSize: "1.8rem" }}>&#128269;</div>
                <p>No topics match &ldquo;podcast.&rdquo; Suggest it — Deep Cuts topics start as feedback.</p>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> Deep Cuts topics are meant to grow over time (TIM-41); once there are enough to
                search/filter, a no-results state that redirects to the existing feedback form turns a dead end into
                another suggestion channel.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Segmented control
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pSegmented}>
                <span className={`${styles.pSegmentedItem} ${styles.active}`}>Decades</span>
                <span className={styles.pSegmentedItem}>Deep Cuts</span>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> mode selection (decade vs. Deep Cuts) currently lives as two separate
                routes/lobby screens with their own visual identity — intentional per TIM-41. A segmented control is
                what a future unified pre-lobby landing screen would need <em>if</em> the two modes ever got merged
                into one entry point instead of two.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Confirmation dialog
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.modalFrame} style={{ maxWidth: "20rem", padding: "1.75rem" }}>
                <h4 className={styles.modalTitle} style={{ fontSize: "1.15rem" }}>
                  Cancel this game?
                </h4>
                <p className={styles.modalSubtitle}>Every connected phone will need the new room code to rejoin.</p>
                <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
                  <button className={styles.btnPill} style={{ flex: 1 }}>
                    Never mind
                  </button>
                  <button className={styles.badgeOutline} style={{ flex: 1, cursor: "pointer", background: "rgba(255,90,95,0.12)" }}>
                    Cancel Game
                  </button>
                </div>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> Cancel Game and Remove Player currently use the arm-then-confirm button pattern
                (press once to arm, again to confirm) specifically to avoid a modal&rsquo;s layout reflow in a tight
                lobby row. A real modal confirm is the fallback for a higher-stakes action that isn&rsquo;t tied to
                one small button — e.g. a future &ldquo;delete my stats&rdquo; action once any persistence exists.
              </p>
            </div>
          </div>

          <div className={styles.proposedBlock}>
            <span className={styles.proposedTag}>Proposed</span>
            <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>
              Tooltip
            </h3>
            <div className={styles.proposedDemo}>
              <div className={styles.pTooltipWrap}>
                <PlayerAvatar player={MOCK_PLAYERS[5]} size="sm" showName={false} />
                <div className={styles.pTooltip}>Press OK to select</div>
              </div>
              <p className={styles.proposedRationale}>
                <strong>Why:</strong> the D-pad radiogroup gap flagged in the README (arrow keys move focus but
                don&rsquo;t wrap or auto-select on the decade filter) is exactly the kind of thing a one-time
                contextual tooltip could clarify for first-time TV/remote users, without a permanent help-text line
                competing for space on every screen.
              </p>
            </div>
          </div>
        </section>

        <hr className={styles.rule} />

        {/* ============================= PRINCIPLES ============================= */}
        <section id="principles">
          <span className={styles.eyebrow}>Reference</span>
          <h2 className={styles.sectionTitle}>Usage principles</h2>
          <div className={styles.principleList}>
            <div className={styles.principle}>
              <span className={styles.principleNum}>01</span>
              <div className={styles.principleBody}>
                <strong>Focus and selection are never the same color.</strong>
                <p>
                  $focus-ring-color is fixed cyan-blue in every decade theme; marigold (or a decade&rsquo;s own
                  accent) means &ldquo;selected.&rdquo; Conflating the two was a real bug (TIM-45) — a
                  focused-but-unselected pill and an actually-selected one both read as &ldquo;the active one.&rdquo;
                </p>
              </div>
            </div>
            <div className={styles.principle}>
              <span className={styles.principleNum}>02</span>
              <div className={styles.principleBody}>
                <strong>Coral and teal don&rsquo;t theme.</strong>
                <p>
                  Every other accent can shift per decade or Deep Cuts topic. Wrong/correct feedback can&rsquo;t — a
                  player needs to trust that color instantly, every session, regardless of era.
                </p>
              </div>
            </div>
            <div className={styles.principle}>
              <span className={styles.principleNum}>03</span>
              <div className={styles.principleBody}>
                <strong>D-pad vs. touch are different motion languages.</strong>
                <p>
                  <code className={styles.inlineCode}>dpad-focusable</code> (border + glow + lift) for TV routes;{" "}
                  <code className={styles.inlineCode}>tappable</code> (press-scale + guaranteed 44px target) for
                  phone routes. A component never needs both — routes don&rsquo;t share screens.
                </p>
              </div>
            </div>
            <div className={styles.principle}>
              <span className={styles.principleNum}>04</span>
              <div className={styles.principleBody}>
                <strong>Headlines are Archivo Black and nothing else is.</strong>
                <p>
                  Even question text — the thing players read most — stays in Archivo at sentence case. All-caps is
                  reserved for short marquee moments, not sustained reading (TIM-36).
                </p>
              </div>
            </div>
            <div className={styles.principle}>
              <span className={styles.principleNum}>05</span>
              <div className={styles.principleBody}>
                <strong>The scanline sweep is the one signature effect.</strong>
                <p>
                  It&rsquo;s the throughline tying every screen back to &ldquo;broadcast&rdquo; without competing
                  with content — a reason not to add a second ambient animation layered on top of it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.docFooter}>
          <p>
            Sourced from app/styles/_theme.scss, _mixins.scss, and the real components rendered above. Proposed
            section is speculative — none of it is built. Not linked from any page in the app.
          </p>
        </footer>
      </main>
    </div>
  );
}
