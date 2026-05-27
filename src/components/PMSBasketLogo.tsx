import React from 'react';

interface PMSBasketLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: number;
  lightMode?: boolean;
}

export default function PMSBasketLogo({
  className = '',
  iconOnly = false,
  size,
  lightMode = false,
}: PMSBasketLogoProps) {
  // Determine text coloring based on dark or light mode contexts
  const pmsColor = lightMode ? 'text-slate-900' : 'text-white';
  const basketTextColor = 'text-[#3E8043]'; // Olive green from the uploaded logo
  const mottoColor = lightMode ? 'text-slate-500' : 'text-slate-400';

  if (iconOnly) {
    const iconSize = size || 36;
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        className={`${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circle Ring */}
        <circle cx="50" cy="50" r="46" stroke="url(#goldNavyRadial)" strokeWidth="3" fill="none" />
        <circle cx="50" cy="50" r="41" stroke="#0F172A" strokeOpacity="0.1" strokeWidth="1" fill="none" />

        {/* --- ELEMENTS INSIDE THE BASKET --- */}
        {/* Wallet (Left) - Colored Navy & Gold */}
        <rect x="23" y="32" width="18" height="15" rx="3" fill="#1E293B" transform="rotate(-6 32 39.5)" />
        <path d="M22 34C22 34 29 27 35 30" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        <rect x="36" y="36.5" width="4" height="4" rx="1" fill="#E2E8F0" />

        {/* Growing Plant (Far Right) */}
        <path d="M72 45C72 38 76 34 78 35" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        <path d="M72 45C72 40 68 38 67 40" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="72" cy="45" r="1.5" fill="#3D503E" />

        {/* Rising Chart Bars (Center) */}
        <rect x="39" y="35" width="4" height="11" rx="1" fill="#2E7D32" />
        <rect x="45" y="31" width="4" height="15" rx="1" fill="#4B6E4E" />
        <rect x="51" y="27" width="4" height="19" rx="1" fill="#497334" />

        {/* Rising Gold Trend Arrow */}
        <path
          d="M37 39L43 31L49 33L58 20"
          stroke="#DAA520"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M53 20H58V25"
          stroke="#DAA520"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Target Bullseye (Right/Center) */}
        <circle cx="64" cy="31" r="9" stroke="#1E3A8A" strokeWidth="3" fill="#F8FAFC" />
        <circle cx="64" cy="31" r="5" stroke="#1E3A8A" strokeWidth="2" />
        <circle cx="64" cy="31" r="1.5" fill="#B91C1C" />
        {/* Dart Arrow pointing inwards */}
        <path
          d="M74 21L66.5 28.5"
          stroke="#1E40AF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M74 21L72 24M74 21L71 19" stroke="#1E40AF" strokeWidth="1.5" />

        {/* --- MAIN SHOPPING BASKET --- */}
        {/* Basket container */}
        <path
          d="M18 42H82C84 42 85 43.5 84.5 45L78 68C77.5 70 75 71 73 71H27C25 71 22.5 70 22 68L15.5 45C15 43.5 16 42 18 42Z"
          fill="#0D2040"
          stroke="#1F324C"
          strokeWidth="1"
        />
        {/* Basket Side Rim */}
        <path
          d="M14 43.5C14 42.1 15.1 41 16.5 41H83.5C84.9 41 86 42.1 86 43.5V44.5C86 45.9 84.9 47 83.5 47H16.5C15.1 47 14 45.9 14 44.5V43.5Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="0.5"
        />
        {/* Horizontal Basket Weave lines */}
        <path d="M21 51H79" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M23 59H77" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

        {/* Embossed Text Inside the Basket */}
        <text
          x="50"
          y="56"
          fill="#E5A93C"
          fontSize="9"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="1"
        >
          PMS
        </text>
        <rect x="33" y="58" width="34" height="6.5" rx="1.5" fill="#0C1B31" />
        <text
          x="50"
          y="63.5"
          fill="#FFFFFF"
          fontSize="5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="1"
        >
          BASKET
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="goldNavyRadial" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5A93C" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Full branding display mode
  const fullSize = size || 180;
  return (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      {/* Icon portion using vector representation */}
      <PMSBasketLogo iconOnly size={fullSize} />

      {/* Corporate dual-tone text container */}
      <div className="space-y-1 mt-2">
        <h2 className="text-3xl md:text-4xl tracking-tight font-black flex items-center justify-center">
          <span className={`${pmsColor}`}>PMS</span>
          <span className={`${basketTextColor} ml-1`}>BASKET</span>
        </h2>

        {/* Brand motto & pillars */}
        <p className="text-[9px] font-black tracking-[0.25em] text-slate-400 uppercase leading-none">
          Personal Finance • Goal Planning • Better Future
        </p>

        {/* Dynamic Curved Ribbon graphic equivalent */}
        <div className="pt-2 flex flex-col items-center">
          <div className="h-[1px] w-28 bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-1.5" />
          <p className={`text-[10px] font-bold ${mottoColor} italic tracking-wider`}>
            "Plan Smart. Invest Wisely. Achieve More."
          </p>
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-1.5" />
        </div>
      </div>
    </div>
  );
}
