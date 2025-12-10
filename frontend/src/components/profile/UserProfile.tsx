'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, Phone, Home, Calendar, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

export interface UserProfile {
  name: string;
  ic_number: string;
  age: number;
  disability_level: string;
  home_address: string;
  race: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface UserProfileProps {
  profile: UserProfile | null;
  className?: string;
}

export function UserProfile({ profile, className }: UserProfileProps) {
  if (!profile) {
    return null;
  }

  const isDeaf = profile.disability_level.toLowerCase() === 'deaf';

  return (
    <Card className={cn('border-2', isDeaf ? 'border-green-500' : 'border-gray-300', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </span>
          {isDeaf && (
            <Badge variant="success" className="animate-pulse">
              Deaf Mode Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">IC Number</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.ic_number}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Age
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.age} years old
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Race
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.race}
            </p>
          </div>
        </div>

        {/* Disability Level */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Disability Level
          </p>
          <Badge
            variant={isDeaf ? 'success' : 'warning'}
            className="text-sm"
          >
            {profile.disability_level}
          </Badge>
        </div>

        {/* Address */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Home className="h-3 w-3" />
            Home Address
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {profile.home_address}
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Emergency Contact
          </p>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.emergency_contact.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {profile.emergency_contact.relationship}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {profile.emergency_contact.phone}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

