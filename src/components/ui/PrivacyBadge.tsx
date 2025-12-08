import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/constants';
import { ProcessingMode } from '@/types/sign-language';

interface PrivacyBadgeProps {
  mode: ProcessingMode;
  className?: string;
}

export function PrivacyBadge({ mode, className }: PrivacyBadgeProps) {
  const modeConfig = {
    local: {
      label: 'Processing Locally',
      icon: Lock,
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    },
    edge: {
      label: 'Edge Processing',
      icon: Shield,
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    },
    server: {
      label: 'Server Processing',
      icon: Shield,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    },
  };

  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
