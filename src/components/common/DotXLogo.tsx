import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'glass';
  className?: string;
  showText?: boolean;
  tagline?: string;
  textColor?: string;
}

/**
 * Exact Dot X Logo matching the reference brand design:
 * Rounded squircle icon with cyan dot before a bold modern 'X',
 * crisp typography "Dot X Library" with subtitle "Advanced Academic Learning Platform".
 */
export const DotXLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  className = '',
  showText = false,
  tagline,
  textColor
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', dot: 'w-1.5 h-1.5', x: 'text-sm font-black' },
    md: { box: 'w-10 h-10', dot: 'w-2 h-2', x: 'text-xl font-black' },
    lg: { box: 'w-12 h-12', dot: 'w-2.5 h-2.5', x: 'text-2xl font-black' },
    xl: { box: 'w-16 h-16', dot: 'w-3 h-3', x: 'text-3xl font-black' }
  };

  const { box, dot, x } = sizeMap[size];

  // SVG customized for ultra-sharp vector rendering matching the exact graphic
  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Icon Squircle Box */}
      <div
        className={`relative ${box} rounded-2xl flex items-center justify-center transition-transform duration-200 shadow-md ${
          variant === 'light'
            ? 'bg-white text-[#0f172a] shadow-black/10 border border-slate-100'
            : variant === 'dark'
            ? 'bg-[#0b1329] text-white border border-slate-700/60 shadow-indigo-950/40'
            : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
        }`}
      >
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Cyan/Aqua Dot with slight soft glow */}
          <circle cx="11" cy="28.5" r="4" fill="#06b6d4" />

          {/* Bold X with modern tapered cuts */}
          <path
            d="M17.5 13L24 22.5L17 32H22L26.5 25.5L31 32H36L29 22.5L35.5 13H30.5L26.5 19.2L22.5 13H17.5Z"
            fill={variant === 'light' ? '#0f172a' : '#ffffff'}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div
            className={`font-black tracking-tight leading-tight flex items-center ${
              size === 'xl'
                ? 'text-2xl sm:text-3xl'
                : size === 'lg'
                ? 'text-xl sm:text-2xl'
                : size === 'md'
                ? 'text-lg sm:text-xl'
                : 'text-sm'
            } ${textColor || (variant === 'light' ? 'text-white' : 'text-slate-900')}`}
          >
            <span>Dot X Learner Platform</span>
          </div>
          {tagline && (
            <p
              className={`text-[10px] sm:text-[11px] font-medium tracking-wide ${
                textColor ? 'opacity-80' : variant === 'light' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
