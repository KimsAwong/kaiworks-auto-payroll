import companyLogo from "@/assets/company-logo.png";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16',
  };

  return (
    <div className="flex items-center gap-3">
      <img 
        src={companyLogo} 
        alt="KAIAWORKS Logo" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight text-foreground">
            KaiaWorks
          </span>
          <span className="text-xs font-semibold text-primary">Auto PayRoll</span>
        </div>
      )}
    </div>
  );
}
