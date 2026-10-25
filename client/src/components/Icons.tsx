import type { ReactNode } from 'react';

// Lucide-style 24px stroke icons. Controls are icon-only: no on-screen text.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export const ArrowIcon = () => (
  <Icon>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <path d="M9 5v14M15 5v14" />
  </Icon>
);

export const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15l12-7.5z" />
  </Icon>
);

export const InfinityIcon = () => (
  <Icon>
    <path d="M18.18 8c5.1 0 5.1 8 0 8-5.1 0-7.13-8-12.74-8-4.58 0-4.58 8 0 8 5.6 0 7.64-8 12.74-8z" />
  </Icon>
);

export const TimerIcon = () => (
  <Icon>
    <path d="M10 2h4M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </Icon>
);

export const TargetIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const ChevronUpIcon = () => (
  <Icon>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const ChevronDownIcon = () => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
