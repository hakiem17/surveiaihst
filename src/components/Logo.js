export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lg-logo" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2ee6c0" />
          <stop offset="1" stopColor="#7b8cff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#lg-logo)" opacity="0.16" />
      <rect x="1" y="1" width="38" height="38" rx="11" stroke="url(#lg-logo)" strokeOpacity="0.5" />
      <path d="M11 27V20M17 27V14M23 27V17M29 27V11" stroke="url(#lg-logo)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="29" cy="11" r="2.6" fill="#2ee6c0" />
    </svg>
  );
}
