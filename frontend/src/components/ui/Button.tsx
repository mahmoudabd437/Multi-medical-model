import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_18px_50px_rgba(37,99,235,0.28)] hover:brightness-110',
  secondary: 'bg-white/6 text-white ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/15',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/8 hover:text-white',
  outline: 'border border-white/14 bg-transparent text-white hover:border-white/20 hover:bg-white/8',
};

export function Button({ className, variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
