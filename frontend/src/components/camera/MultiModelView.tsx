'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Layers } from 'lucide-react';

interface ModelPrediction {
  model_id: string;
  predictions: any[];
  best_prediction: {
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  bbox_count: number;
  color: [number, number, number];
  error?: string;
}

interface MultiModelViewProps {
  annotatedImage?: string;
  models?: Record<string, ModelPrediction>;
  bestOverall?: {
    label: string;
    confidence: number;
    model: string;
    ai_interpretation?: string;
  };
  totalModels?: number;
  modelsWithDetections?: number;
  className?: string;
}

export function MultiModelView({
  annotatedImage,
  models,
  bestOverall,
  totalModels = 0,
  modelsWithDetections = 0,
  className = '',
}: MultiModelViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!annotatedImage && !models) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Annotated Image with Bounding Boxes */}
      {annotatedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Multi-Model Detection
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Annotated Image */}
              <div className="relative rounded-lg overflow-hidden bg-gray-900">
                <img
                  src={annotatedImage}
                  alt="Annotated detection"
                  className="w-full h-auto"
                />
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {modelsWithDetections} of {totalModels} models detected signs
                </span>
                {bestOverall && (
                  <Badge variant="success">
                    Best: {bestOverall.label} ({(bestOverall.confidence * 100).toFixed(0)}%)
                  </Badge>
                )}
              </div>

              {/* Best Overall Result */}
              {bestOverall && bestOverall.ai_interpretation && (
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">AI</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        AI Interpretation:
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        "{bestOverall.ai_interpretation}"
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Detected by: {bestOverall.model}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Model Results */}
              {showDetails && models && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Individual Model Results:
                  </h4>
                  {Object.entries(models).map(([modelName, modelData]) => (
                    <div
                      key={modelName}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: `rgb(${modelData.color[2]}, ${modelData.color[1]}, ${modelData.color[0]})`,
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {modelName}
                          </span>
                        </div>
                        {modelData.bbox_count > 0 ? (
                          <Badge variant="success" size="sm">
                            {modelData.bbox_count} detection{modelData.bbox_count > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">
                            No detection
                          </Badge>
                        )}
                      </div>

                      {modelData.best_prediction && (
                        <div className="ml-5 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Class:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {modelData.best_prediction.class}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Confidence:
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {(modelData.best_prediction.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {modelData.error && (
                        <div className="ml-5 text-xs text-red-600 dark:text-red-400">
                          Error: {modelData.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

