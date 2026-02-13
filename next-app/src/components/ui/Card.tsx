interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'glow' | 'outlined';
  children: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default:
    'bg-[var(--color-surface)] border border-[var(--color-border)]/50 shadow-lg shadow-black/20',
  elevated:
    'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/50 shadow-xl shadow-black/30',
  glow:
    'bg-[var(--color-surface)] border border-[var(--color-primary)]/40 shadow-lg shadow-[var(--color-primary)]/10 animate-pulse-glow',
  outlined:
    'bg-transparent border border-[var(--color-border)] shadow-none',
};

export default function Card({ padding = 'md', variant = 'default', children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
