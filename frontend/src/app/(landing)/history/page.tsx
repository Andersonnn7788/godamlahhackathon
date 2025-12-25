'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  MapPin,
  FileText,
  Hash,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Brain,
  Sparkles,
  ChevronRight,
  X,
  TrendingUp,
  Info,
  Lightbulb,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VisitHistoryItem, PersonalizedGreeting } from '@/types/greeting';
import { PredictionResult } from '@/types/prediction';
import axios from 'axios';

// Default user for demo
const DEFAULT_USER_ID = '900125-14-0123';

function getStatusBadge(status: VisitHistoryItem['status']) {
  switch (status) {
    case 'Completed':
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'In Progress':
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          In Progress
        </Badge>
      );
    case 'Pending':
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Pending
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function HistoryItemCard({ item }: { item: VisitHistoryItem }) {
  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header: Location and Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {item.location}
              </h3>
            </div>
            {getStatusBadge(item.status)}
          </div>

          {/* Application Type */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.application}
            </span>
          </div>

          {/* Date and Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(item.datetime).toLocaleString('en-MY', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Queue Number */}
          {item.queue && (
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Queue: <span className="font-medium">{item.queue}</span>
              </span>
            </div>
          )}

          {/* Required Documents */}
          {item.documents_requested && item.documents_requested.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Required Documents:
              </p>
              <div className="flex flex-wrap gap-2">
                {item.documents_requested.map((doc, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Language */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Preferred Language: <span className="font-medium">{item.preferred_language}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VideoAvatarWidgetProps {
  greeting: PersonalizedGreeting | null;
  prediction: PredictionResult | null;
  isLoading: boolean;
  onQuickAction?: (action: string) => void;
}

function VideoAvatarWidget({
  greeting,
  prediction,
  isLoading,
  onQuickAction,
}: VideoAvatarWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPredictionDetails, setShowPredictionDetails] = useState(true);

  useEffect(() => {
    if (greeting) {
      setIsOpen(true);
    }
  }, [greeting]);

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  // Get confidence level indicator
  const getConfidenceLevel = (confidence: number) => {
    const percent = Math.round(confidence * 100);
    if (percent >= 85) return { label: 'Very High', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' };
    if (percent >= 70) return { label: 'High', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/40' };
    if (percent >= 55) return { label: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/40' };
    return { label: 'Low', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/40' };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-4">
      {isOpen && (
        <div className="pointer-events-auto w-[420px] rounded-3xl bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-cyan-100/70 dark:border-cyan-900/50 backdrop-blur-xl overflow-hidden">
          {/* Gradient Header Background */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/10 blur-2xl" aria-hidden />

          {/* Header */}
          <div className="relative z-10 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b border-cyan-100 dark:border-cyan-900/50 px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    SmartSign Assistant
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live BIM signing available
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/60 rounded-lg transition-colors"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-5 space-y-4 max-h-[500px] overflow-y-auto">
            {/* Greeting Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0">
                AI
              </div>
              <div className="flex-1">
                <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/40 dark:to-blue-900/40 border border-cyan-100 dark:border-cyan-800 px-4 py-3 shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                    {greeting?.greeting_text ?? 'Welcome! Analyzing your visit history...'}
                  </p>
                  {greeting?.is_personalized && (
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-cyan-100 dark:border-cyan-800">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Personalized based on your history
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced AI Prediction Section */}
            {prediction && (
              <div className="ml-11 space-y-3">
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800 overflow-hidden shadow-md">
                  {/* Prediction Header */}
                  <div className="px-4 py-3 border-b border-purple-200 dark:border-purple-800 bg-purple-100/50 dark:bg-purple-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                          AI Prediction Analysis
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="purple"
                          className={`text-[10px] h-5 font-semibold ${getConfidenceLevel(prediction.confidence).bgColor} ${getConfidenceLevel(prediction.confidence).color} border-0`}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {Math.round(prediction.confidence * 100)}% {getConfidenceLevel(prediction.confidence).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Main Prediction */}
                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                          Predicted Intent
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                        {prediction.predicted_intent}
                      </p>
                    </div>

                    {/* Reasoning */}
                    {prediction.reasoning && (
                      <div className="pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-start gap-2 mb-1">
                          <Info className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                          <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                            Why we think so
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed ml-5">
                          {prediction.reasoning}
                        </p>
                      </div>
                    )}

                    {/* Supporting Visits */}
                    {prediction.supporting_visits && prediction.supporting_visits.length > 0 && (
                      <div className="pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                            Based on {prediction.supporting_visits.length} recent visit{prediction.supporting_visits.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-5">
                          {prediction.supporting_visits.slice(0, 3).map((visit, index) => (
                            <Badge key={index} variant="default" className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                              {visit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alternative Intents */}
                    {prediction.alternative_intents && prediction.alternative_intents.length > 0 && showPredictionDetails && (
                      <div className="pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Other Possibilities
                          </span>
                        </div>
                        <div className="space-y-1.5 ml-5">
                          {prediction.alternative_intents.slice(0, 2).map((alt, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-lg px-2.5 py-1.5 border border-gray-200 dark:border-gray-700">
                              <span className="text-xs text-gray-700 dark:text-gray-300">{alt.intent}</span>
                              <Badge variant="default" className="text-[10px] h-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0">
                                {Math.round(alt.confidence * 100)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {greeting?.quick_actions && greeting.quick_actions.length > 0 && (
              <div className="ml-11 space-y-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Suggested Actions
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {greeting.quick_actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="group px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-900/40 dark:hover:to-blue-900/40 border border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700 text-sm text-gray-700 dark:text-gray-200 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                    >
                      <span className="font-medium group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                        {action}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 px-5 py-2.5">
            <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
              Powered by SmartSign AI • Real-time analysis
            </p>
          </div>
        </div>
      )}

      <div
        className="relative w-64 h-80 cursor-pointer select-none group"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle assistant panel"
      >
        <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-2xl border-2 border-cyan-100/70 dark:border-cyan-900/60 bg-white group-hover:border-cyan-300 dark:group-hover:border-cyan-700 transition-all">
          <video
            src="/avatars/godamlah_avatar_video2.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/80 px-3 py-1.5 rounded-full text-xs font-semibold text-cyan-700 dark:text-cyan-200 shadow-lg backdrop-blur-sm border border-cyan-200 dark:border-cyan-800">
            Live BIM avatar
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-3 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          )}
          {!isOpen && greeting && (
            <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [visitHistory, setVisitHistory] = useState<VisitHistoryItem[]>([]);
  const [greeting, setGreeting] = useState<PersonalizedGreeting | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChatbot, setIsLoadingChatbot] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch visit history and greeting on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingChatbot(true);
      setError(null);

      try {
        // Fetch visit history
        const historyResponse = await axios.get(
          `http://localhost:8000/visit-history/${DEFAULT_USER_ID}`,
          { timeout: 10000 }
        );

        if (historyResponse.data.success) {
          setVisitHistory(historyResponse.data.visits);
        }

        // Fetch greeting with prediction
        const greetingResponse = await axios.post(
          'http://localhost:8000/generate-greeting',
          {
            user_id: DEFAULT_USER_ID,
            current_location: 'Government Service Center',
            include_prediction: true,
          },
          { timeout: 15000 }
        );

        if (greetingResponse.data.success) {
          setGreeting(greetingResponse.data.greeting);
          if (greetingResponse.data.prediction) {
            setPrediction(greetingResponse.data.prediction);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Backend may be offline.');
      } finally {
        setIsLoading(false);
        setIsLoadingChatbot(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickAction = (action: string) => {
    console.log('Quick action clicked:', action);
    // You can add navigation or other functionality here
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const historyResponse = await axios.get(
        `http://localhost:8000/visit-history/${DEFAULT_USER_ID}`,
        { timeout: 10000 }
      );

      if (historyResponse.data.success) {
        setVisitHistory(historyResponse.data.visits);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">My Visit History</CardTitle>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                  <span className="ml-3 text-gray-500">Loading visit history...</span>
                </div>
              ) : visitHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No visit history found.</p>
                </div>
              ) : (
                visitHistory.map((item) => (
                  <HistoryItemCard key={item.id} item={item} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Video Avatar Widget - Floating video assistant in bottom-right */}
      <VideoAvatarWidget
        greeting={greeting}
        prediction={prediction}
        isLoading={isLoadingChatbot}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
