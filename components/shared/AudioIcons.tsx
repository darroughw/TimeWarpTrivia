import { useId, type ReactNode } from "react";

// Solid, rounded audio icons for MusicToggle and SoundToggle — filled
// shapes (unlike HelpIcons' line art) so they stay legible at the toggles'
// small size. The "off" variants add a rounded diagonal slash, with a thin
// gap cut out of the icon underneath it so the slash reads as a separate
// stroke. All drawn in currentColor on one 24x24 grid.

// The SVG <mask> ids must be unique per instance on the page, hence useId.
function Slashed({ children }: { children: ReactNode }) {
  const maskId = `audio-slash-${useId()}`;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <path d="M3.5 3.5 20.5 20.5" stroke="black" strokeWidth="5" strokeLinecap="round" />
      </mask>
      <g mask={`url(#${maskId})`}>{children}</g>
      <path d="M3.5 3.5 20.5 20.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Two beamed eighth notes.
function Notes() {
  return (
    <g fill="currentColor">
      <path
        d="M8.2 6.4 20.3 4.2v3.6L8.2 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="8" y="6.2" width="2.3" height="11.4" rx="1.15" />
      <rect x="18.2" y="4" width="2.3" height="11.6" rx="1.15" />
      <circle cx="6.9" cy="17.6" r="3.3" />
      <circle cx="17.1" cy="15.6" r="3.3" />
    </g>
  );
}

// A speaker with two sound waves.
function Speaker() {
  return (
    <g>
      <path
        d="M4.5 9.2h3.2l4.6-3.9c.6-.5 1.4-.1 1.4.7v12c0 .8-.8 1.2-1.4.7l-4.6-3.9H4.5c-.6 0-1-.4-1-1v-3.6c0-.6.4-1 1-1Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16.6 9.2a4 4 0 0 1 0 5.6M19.2 6.6a7.6 7.6 0 0 1 0 10.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function MusicOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <Notes />
    </svg>
  );
}

export function MusicOffIcon() {
  return (
    <Slashed>
      <Notes />
    </Slashed>
  );
}

export function SoundOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <Speaker />
    </svg>
  );
}

export function SoundOffIcon() {
  return (
    <Slashed>
      <Speaker />
    </Slashed>
  );
}
