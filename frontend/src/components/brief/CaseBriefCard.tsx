'use client';

import { CaseBrief } from '@/types/case-brief';
import { Badge } from '@/components/ui/Badge';
import {
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Clock,
  Shield,
} from 'lucide-react';

interface CaseBriefCardProps {
  brief: CaseBrief | null;
  isLoading: boolean;
  className?: string;
}

export function CaseBriefCard({ brief, isLoading, className = '' }: CaseBriefCardProps) {
  if (isLoading) {
    return (
      <div className={`rounded-lg border-2 border-cyan-300 dark:border-cyan-700 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 p-4 ${className}`}>
        <div className="flex items-center gap-3 text-cyan-700 dark:text-cyan-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Generating Smart Brief...</span>
        </div>
      </div>
    );
  }

  if (!brief) {
    return null;
  }

  return (
    <div className={`rounded-lg border-2 border-cyan-300 dark:border-cyan-700 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-600 rounded-md">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Smart Brief
          </h3>
        </div>
        {brief.privacy_verified && (
          <Badge variant="success" className="text-[10px] h-5">
            <Shield className="h-3 w-3" />
            Privacy Verified
          </Badge>
        )}
      </div>

      {/* Narrative Summary - Most Prominent */}
      <div className="bg-white/80 dark:bg-gray-900/60 rounded-lg p-3 mb-3 border border-cyan-200 dark:border-cyan-800">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          {brief.narrative}
        </p>
      </div>

      {/* Key Points */}
      {brief.key_points && brief.key_points.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Key Points</span>
          </div>
          <ul className="space-y-1">
            {brief.key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending Items - Highlighted */}
      {brief.pending_items && brief.pending_items.length > 0 && (
        <div className="mb-3 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Pending Items</span>
          </div>
          <ul className="space-y-1">
            {brief.pending_items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {brief.recommended_actions && brief.recommended_actions.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950/30 rounded-md p-2 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-800 dark:text-green-300">Recommended Actions</span>
          </div>
          <ul className="space-y-1">
            {brief.recommended_actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400">
                <span className="text-green-500 mt-0.5">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Context Sources - Footer */}
      {brief.context_sources && brief.context_sources.length > 0 && (
        <div className="mt-3 pt-2 border-t border-cyan-200 dark:border-cyan-800">
          <p className="text-[10px] text-gray-500 dark:text-gray-500">
            Sources: {brief.context_sources.join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
}
