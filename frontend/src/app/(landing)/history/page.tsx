'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, MapPin, FileText, Hash, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface HistoryItem {
  location: string;
  datetime: string;
  application: string;
  queue?: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  documents: string[];
  preferred_language: string;
}

const mockHistoryData: HistoryItem[] = [
  {
    location: 'Immigration',
    datetime: '2025-01-05 09:30',
    application: 'Passport Renewal',
    queue: 'A032',
    status: 'In Progress',
    documents: ['Old Passport', 'IC'],
    preferred_language: 'BIM',
  },
  {
    location: 'JPJ',
    datetime: '2024-12-15 14:20',
    application: 'Driving License',
    queue: 'B102',
    status: 'Completed',
    documents: ['IC', 'Photo'],
    preferred_language: 'Malay',
  },
  {
    location: 'Hospital',
    datetime: '2024-12-10 11:15',
    application: 'Medical Checkup',
    queue: 'C045',
    status: 'Completed',
    documents: ['IC', 'Medical Card'],
    preferred_language: 'BIM',
  },
  {
    location: 'Immigration',
    datetime: '2024-11-28 15:45',
    application: 'Visa Application',
    queue: 'A089',
    status: 'Pending',
    documents: ['Passport', 'IC', 'Photo', 'Travel Itinerary'],
    preferred_language: 'BIM',
  },
  {
    location: 'JPJ',
    datetime: '2024-11-20 10:00',
    application: 'Vehicle Registration',
    queue: 'B156',
    status: 'Completed',
    documents: ['IC', 'Vehicle Documents'],
    preferred_language: 'English',
  },
];

function getStatusBadge(status: HistoryItem['status']) {
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

function HistoryItemCard({ item }: { item: HistoryItem }) {
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
            <span className="text-sm text-gray-600 dark:text-gray-400">{item.datetime}</span>
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
          {item.documents && item.documents.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Required Documents:
              </p>
              <div className="flex flex-wrap gap-2">
                {item.documents.map((doc, index) => (
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

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">My Visit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {mockHistoryData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No visit history found.</p>
                </div>
              ) : (
                mockHistoryData.map((item, index) => (
                  <HistoryItemCard key={index} item={item} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

