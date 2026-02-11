interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ padding = 'md', children, className = '' }: CardProps) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
