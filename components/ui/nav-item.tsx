'use client';

interface NavItemProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

export function NavItem({
  href,
  label,
  isActive,
  onClick,
  className,
}: NavItemProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        text-sm font-medium transition-colors
        hover:text-[#CDFE5A]
        ${isActive ? 'text-[#CDFE5A] font-bold' : 'text-white'}
        ${className}
      `}
    >
      {label}
    </a>
  );
}
