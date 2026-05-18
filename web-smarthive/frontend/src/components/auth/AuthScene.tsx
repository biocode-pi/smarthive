export function AuthScene({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe2f6" />
          <stop offset="60%" stopColor="#e7f3fb" />
          <stop offset="100%" stopColor="#f4faf3" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7bbf6a" />
          <stop offset="100%" stopColor="#4a9a47" />
        </linearGradient>
        <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fb8c9" />
          <stop offset="100%" stopColor="#6896ab" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdd3d6" />
          <stop offset="100%" stopColor="#a6adb1" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="800" height="1000" fill="url(#sky)" />

      <g opacity="0.85">
        <ellipse cx="120" cy="180" rx="60" ry="14" fill="#ffffff" />
        <ellipse cx="160" cy="172" rx="40" ry="12" fill="#ffffff" />
        <ellipse cx="560" cy="140" rx="80" ry="16" fill="#ffffff" />
        <ellipse cx="620" cy="130" rx="48" ry="13" fill="#ffffff" />
        <ellipse cx="700" cy="240" rx="55" ry="13" fill="#ffffff" />
      </g>

      <path
        d="M0,640 L120,520 L220,600 L320,500 L420,580 L520,490 L640,580 L760,520 L800,560 L800,720 L0,720 Z"
        fill="url(#mountain)"
        opacity="0.9"
      />
      <path
        d="M0,700 L80,620 L180,680 L300,600 L420,680 L540,610 L660,680 L800,640 L800,760 L0,760 Z"
        fill="#5e8da0"
        opacity="0.75"
      />

      <rect x="0" y="720" width="800" height="280" fill="url(#grass)" />

      <path
        d="M380,720 Q360,820 320,1000 L480,1000 Q440,820 420,720 Z"
        fill="url(#road)"
      />
      <g stroke="#f4c945" strokeWidth="6" strokeDasharray="22 18" fill="none">
        <path d="M400,720 Q396,820 380,1000" />
      </g>

      <g transform="translate(110,640)">
        <path d="M0,80 L20,40 L40,80 Z" fill="#2a6d3a" />
        <path d="M-5,55 L20,15 L45,55 Z" fill="#2f7d42" />
        <path d="M-8,30 L20,-10 L48,30 Z" fill="#357d49" />
        <rect x="17" y="80" width="6" height="14" fill="#5a3b1f" />
      </g>
      <g transform="translate(155,650)">
        <path d="M0,70 L18,35 L36,70 Z" fill="#28663a" />
        <path d="M-4,48 L18,12 L40,48 Z" fill="#2d7340" />
        <rect x="15" y="70" width="6" height="12" fill="#5a3b1f" />
      </g>
      <g transform="translate(640,620)">
        <path d="M0,100 L26,40 L52,100 Z" fill="#2a6d3a" />
        <path d="M-6,70 L26,12 L58,70 Z" fill="#2f7d42" />
        <path d="M-10,40 L26,-15 L62,40 Z" fill="#357d49" />
        <rect x="22" y="100" width="8" height="18" fill="#5a3b1f" />
      </g>
      <g transform="translate(700,660)">
        <circle cx="20" cy="50" r="32" fill="#3c8a4c" />
        <circle cx="0" cy="62" r="26" fill="#4a9a55" />
        <circle cx="38" cy="64" r="22" fill="#357c45" />
        <rect x="17" y="80" width="6" height="14" fill="#5a3b1f" />
      </g>

      <g transform="translate(560,560) rotate(-12)">
        <ellipse cx="0" cy="0" rx="50" ry="36" fill="#f6c43a" />
        <path
          d="M-50,0 Q-30,-12 -10,0 Q-30,12 -50,0 Z M10,0 Q30,-12 50,0 Q30,12 10,0 Z"
          fill="#1a1a1a"
          opacity="0.18"
        />
        <rect x="-26" y="-30" width="10" height="60" fill="#1a1a1a" rx="2" />
        <rect x="-6" y="-30" width="10" height="60" fill="#1a1a1a" rx="2" />
        <rect x="14" y="-30" width="10" height="60" fill="#1a1a1a" rx="2" />
        <ellipse cx="-32" cy="-26" rx="34" ry="20" fill="#ffffff" opacity="0.55" />
        <ellipse cx="32" cy="-26" rx="34" ry="20" fill="#ffffff" opacity="0.55" />
        <circle cx="-44" cy="6" r="5" fill="#1a1a1a" />
        <path d="M-50,-8 Q-58,-22 -46,-18" stroke="#1a1a1a" strokeWidth="2" fill="none" />
        <path d="M-50,-8 Q-60,-12 -52,-22" stroke="#1a1a1a" strokeWidth="2" fill="none" />
      </g>

      <g transform="translate(220,400)" opacity="0.9">
        <ellipse cx="0" cy="0" rx="20" ry="14" fill="#f6c43a" />
        <ellipse cx="-18" cy="-2" rx="12" ry="8" fill="#ffffff" opacity="0.75" />
        <ellipse cx="18" cy="-2" rx="12" ry="8" fill="#ffffff" opacity="0.75" />
        <rect x="-10" y="-12" width="4" height="24" fill="#1a1a1a" rx="1" />
        <rect x="-2" y="-12" width="4" height="24" fill="#1a1a1a" rx="1" />
        <rect x="6" y="-12" width="4" height="24" fill="#1a1a1a" rx="1" />
      </g>
    </svg>
  );
}
