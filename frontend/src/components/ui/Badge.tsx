import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/constants';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        primary: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-400',
        success: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400',
        danger: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-400',
        purple: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-400',
        active: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


