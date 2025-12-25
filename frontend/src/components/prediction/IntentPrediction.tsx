'use client';

import { PredictionResult } from '@/types/prediction';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Brain, TrendingUp, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface IntentPredictionProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
  className?: string;
}

export function IntentPrediction({ prediction, isLoading, className = '' }: IntentPredictionProps) {
  if (isLoading) {
    return (
      <div className={`rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3 ${className}`}>
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Analyzing visit patterns...</span>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const confidencePercent = Math.round(prediction.confidence * 100);

  // Determine confidence level styling
  const getConfidenceVariant = () => {
    if (confidencePercent >= 80) return 'success';
    if (confidencePercent >= 60) return 'primary';
    if (confidencePercent >= 40) return 'warning';
    return 'default';
  };

  const getConfidenceIcon = () => {
    if (confidencePercent >= 80) return <CheckCircle className="h-3 w-3" />;
    if (confidencePercent >= 60) return <TrendingUp className="h-3 w-3" />;
    if (confidencePercent >= 40) return <AlertCircle className="h-3 w-3" />;
    return <HelpCircle className="h-3 w-3" />;
  };

  return (
    <div className={`rounded-lg border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">
          AI Prediction
        </span>
        <Badge variant={getConfidenceVariant()} className="text-[10px] h-5 ml-auto">
          {getConfidenceIcon()}
          {confidencePercent}%
        </Badge>
      </div>

      {/* Main Prediction */}
      <div className="bg-white/70 dark:bg-gray-900/50 rounded-md p-2 mb-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {prediction.predicted_intent}
        </p>
      </div>

      {/* Reasoning */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {prediction.reasoning}
      </p>

      {/* Alternative Intents */}
      {prediction.alternative_intents && prediction.alternative_intents.length > 0 && (
        <div className="border-t border-purple-200 dark:border-purple-800 pt-2 mt-2">
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-1">Other possibilities:</p>
          <div className="flex flex-wrap gap-1">
            {prediction.alternative_intents.slice(0, 2).map((alt, index) => (
              <Badge key={index} variant="default" className="text-[10px]">
                {alt.intent} ({Math.round(alt.confidence * 100)}%)
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
