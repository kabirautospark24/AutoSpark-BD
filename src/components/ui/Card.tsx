import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

// Surfaces come from semantic tokens, so pages no longer need to fight the
// component with their own bg-* / border-* overrides.
export const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={`bg-card text-card-foreground rounded-2xl border border-border shadow-md ${
        hover
          ? 'transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
