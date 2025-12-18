import { useTranslation } from "react-i18next";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ showText = true, size = "md", className = "" }: LogoProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
  };

  const { icon: iconSize, text: textSize } = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="logo">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25, 95%, 53%)" />
            <stop offset="100%" stopColor="hsl(25, 95%, 45%)" />
          </linearGradient>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(215, 89%, 45%)" />
            <stop offset="100%" stopColor="hsl(215, 89%, 35%)" />
          </linearGradient>
          <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(215, 89%, 65%)" />
            <stop offset="100%" stopColor="hsl(215, 89%, 55%)" />
          </linearGradient>
        </defs>
        
        <rect width="48" height="48" rx="10" fill="url(#logoGradient)" />
        
        <path
          d="M24 10C24 10 16 18 16 25C16 29.4 19.6 33 24 33C28.4 33 32 29.4 32 25C32 18 24 10 24 10Z"
          fill="url(#waterGradient)"
        />
        
        <ellipse cx="21" cy="23" rx="2.5" ry="4" fill="url(#sparkleGradient)" opacity="0.7" />
        
        <path
          d="M12 36C14 34 18 33 24 33C30 33 34 34 36 36"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        <circle cx="35" cy="15" r="2" fill="white" opacity="0.8" />
        <circle cx="38" cy="12" r="1" fill="white" opacity="0.6" />
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-foreground ${textSize}`}>
            {isArabic ? "غسلة ستايل" : "Ghasla Style"}
          </span>
          {size === "lg" && (
            <span className="text-xs text-muted-foreground">
              {isArabic ? "غسيل سيارات متنقل" : "Mobile Car Wash"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(25, 95%, 53%)" />
          <stop offset="100%" stopColor="hsl(25, 95%, 45%)" />
        </linearGradient>
        <linearGradient id="waterGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(215, 89%, 45%)" />
          <stop offset="100%" stopColor="hsl(215, 89%, 35%)" />
        </linearGradient>
        <linearGradient id="sparkleGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(215, 89%, 65%)" />
          <stop offset="100%" stopColor="hsl(215, 89%, 55%)" />
        </linearGradient>
      </defs>
      
      <rect width="48" height="48" rx="10" fill="url(#logoGradientIcon)" />
      
      <path
        d="M24 10C24 10 16 18 16 25C16 29.4 19.6 33 24 33C28.4 33 32 29.4 32 25C32 18 24 10 24 10Z"
        fill="url(#waterGradientIcon)"
      />
      
      <ellipse cx="21" cy="23" rx="2.5" ry="4" fill="url(#sparkleGradientIcon)" opacity="0.7" />
      
      <path
        d="M12 36C14 34 18 33 24 33C30 33 34 34 36 36"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <circle cx="35" cy="15" r="2" fill="white" opacity="0.8" />
      <circle cx="38" cy="12" r="1" fill="white" opacity="0.6" />
    </svg>
  );
}
