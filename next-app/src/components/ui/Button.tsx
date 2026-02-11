import Link from 'next/link';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const baseClasses =
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<string, string> = {
  primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white',
  secondary:
    'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)]',
  danger: 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white',
  ghost:
    'bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  href,
  children,
  onClick,
  className = '',
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
