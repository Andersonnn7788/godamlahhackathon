'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, Phone, Home, Calendar, Users, AlertCircle, MessageSquare, Eye, Volume2, FileText, Info } from 'lucide-react';
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
  preferences?: {
    communication_method?: string;
    requires_interpreter?: boolean | string;
    speech_ability?: string;
    hearing_aid?: boolean;
    lip_reading?: boolean | string;
    written_communication?: string;
    patience_level?: string;
    visual_attention?: string;
    notes?: string;
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

  const isDeaf = profile.disability_level.toLowerCase().includes('deaf');

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

        {/* Communication Preferences */}
        {profile.preferences && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Communication Preferences (For Officers)
            </p>
            
            {/* Communication Method */}
            {profile.preferences.communication_method && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preferred Method</p>
                <Badge variant="primary" className="text-xs">
                  {profile.preferences.communication_method}
                </Badge>
              </div>
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {profile.preferences.requires_interpreter !== undefined && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Interpreter Needed</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {typeof profile.preferences.requires_interpreter === 'boolean'
                      ? profile.preferences.requires_interpreter
                        ? 'Yes'
                        : 'No'
                      : profile.preferences.requires_interpreter}
                  </p>
                </div>
              )}
              {profile.preferences.hearing_aid !== undefined && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Hearing Aid</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.preferences.hearing_aid ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
              {profile.preferences.speech_ability && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Speech Ability</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.preferences.speech_ability}
                  </p>
                </div>
              )}
              {profile.preferences.lip_reading !== undefined && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Lip Reading</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {typeof profile.preferences.lip_reading === 'boolean'
                      ? profile.preferences.lip_reading
                        ? 'Yes'
                        : 'No'
                      : profile.preferences.lip_reading}
                  </p>
                </div>
              )}
            </div>

            {/* Written Communication */}
            {profile.preferences.written_communication && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Written Communication
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {profile.preferences.written_communication}
                </p>
              </div>
            )}

            {/* Visual Attention */}
            {profile.preferences.visual_attention && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Visual Communication Tips
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {profile.preferences.visual_attention}
                </p>
              </div>
            )}

            {/* Patience Level */}
            {profile.preferences.patience_level && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  Communication Pace
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {profile.preferences.patience_level}
                </p>
              </div>
            )}

            {/* Important Notes */}
            {profile.preferences.notes && (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                <p className="text-xs font-medium text-cyan-900 dark:text-cyan-400 mb-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Important Notes for Officers
                </p>
                <p className="text-xs text-cyan-800 dark:text-cyan-300">
                  {profile.preferences.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

