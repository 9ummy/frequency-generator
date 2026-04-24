'use client';

interface DecoProps {
  variant: 'main' | 'result' | 'share';
}

export function Decorations({ variant }: DecoProps) {
  if (variant === 'main') {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 380"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="28" cy="120" r="18" fill="#fff200" stroke="#1a1612" strokeWidth="1.8" />
        <text x="20" y="127" fontSize="16" fill="#1a1612" fontWeight="900">★</text>
        <text x="170" y="180" fontSize="20" fill="#ff6b9d" fontWeight="900" stroke="#1a1612" strokeWidth="0.5">♥</text>
        <circle cx="36" cy="540" r="15" fill="#ffb3cc" stroke="#1a1612" strokeWidth="1.5" />
        <text x="170" y="540" fontSize="18" fill="#2d4a3e" fontWeight="900">✦</text>
        <text
          x="14" y="320" fontSize="11" fill="#1a1612" opacity="0.45"
          fontWeight="900" letterSpacing="3" transform="rotate(-90 14 320)"
        >
          ★ TURN UP ★
        </text>
        <text
          x="188" y="320" fontSize="11" fill="#1a1612" opacity="0.45"
          fontWeight="900" letterSpacing="3" transform="rotate(90 188 320)"
        >
          ★ THE VIBE ★
        </text>
      </svg>
    );
  }
  if (variant === 'result') {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 380"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="32" cy="60" r="18" fill="#fff200" stroke="#1a1612" strokeWidth="1.5" />
        <circle cx="172" cy="320" r="22" fill="#2d4a3e" />
        <circle cx="180" cy="38" r="7" fill="#1a1612" />
        <text
          x="14" y="240" fontSize="9" fill="#1a1612" opacity="0.55"
          fontWeight="900" letterSpacing="2.5" transform="rotate(-90 14 240)"
        >
          ★ FREQUENCY
        </text>
        <text
          x="188" y="240" fontSize="9" fill="#1a1612" opacity="0.55"
          fontWeight="900" letterSpacing="2.5" transform="rotate(90 188 240)"
        >
          ★ PLAYING
        </text>
      </svg>
    );
  }
  // share
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 200 380"
      preserveAspectRatio="xMidYMid slice"
    >
      <text x="14" y="50" fontSize="14" fill="#fff200" fontWeight="900" stroke="#1a1612" strokeWidth="0.7">✦</text>
      <text x="170" y="346" fontSize="14" fill="#ff6b9d" fontWeight="900">♥</text>
      <text
        x="14" y="240" fontSize="9" fill="#1a1612" opacity="0.45"
        fontWeight="900" letterSpacing="2.5" transform="rotate(-90 14 240)"
      >
        ★ COMPLETE
      </text>
      <text
        x="188" y="240" fontSize="9" fill="#1a1612" opacity="0.45"
        fontWeight="900" letterSpacing="2.5" transform="rotate(90 188 240)"
      >
        ★ SHARE NOW
      </text>
    </svg>
  );
}
