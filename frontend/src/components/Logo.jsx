import React from 'react';

export default function Logo({ size = 28, showText = true }) {
  const logoSize = typeof size === 'number' ? size : 28;
  const textSize = Math.round(logoSize * 0.58);
  const fontSize = Math.round(logoSize * 0.44);
  const rx = Math.round(logoSize * 0.2);

  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--accent-400))' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent-700))' }} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx={rx} fill="url(#logo-grad)" />
        <text
          x="50" y="68"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={fontSize * 2.5}
          fontWeight="700"
          textAnchor="middle"
          fill="white"
        >
          O
        </text>
      </svg>
      {showText && (
        <span
          className="hidden md:inline font-semibold text-gray-900 dark:text-gray-100"
          style={{ fontSize: textSize }}
        >
          Oner
        </span>
      )}
    </div>
  );
}
