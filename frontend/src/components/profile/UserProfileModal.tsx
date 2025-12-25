'use client';

import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserProfile } from '@/components/profile/UserProfile';
import {
  generateCommunicationTips,
  generateBehavioralTips,
  getCommunicationSummary,
  needsImmediateInterpreter,
  getDisabilityLevelVariant,
} from '@/lib/utils/profileTips';
import {
  User,
  Phone,
  AlertCircle,
  MessageSquare,
  Eye,
  Volume2,
  FileText,
  Info,
  CheckCircle,
  Heart,
  Calendar,
  MapPin,
  Lightbulb,
  Users,
  Ear,
  MessageCircle,
} from 'lucide-react';
import { CaseBriefCard } from '@/components/brief/CaseBriefCard';
import { CaseBrief } from '@/types/case-brief';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  caseBrief?: CaseBrief | null;
  isLoadingBrief?: boolean;
}

export function UserProfileModal({ isOpen, onClose, profile, caseBrief, isLoadingBrief }: UserProfileModalProps) {
  const communicationTips = generateCommunicationTips(profile);
  const behavioralTips = generateBehavioralTips(profile);
  const needsInterpreter = needsImmediateInterpreter(profile);
  const disabilityVariant = getDisabilityLevelVariant(profile.disability_level);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profile.name}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              IC: {profile.ic_number}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={disabilityVariant} className="text-sm px-3 py-1">
                <Ear className="h-4 w-4 mr-1" />
                {profile.disability_level}
              </Badge>
              {needsInterpreter && (
                <Badge variant="danger" className="text-sm px-3 py-1 animate-pulse">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Interpreter Required
                </Badge>
              )}
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Got It
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="px-6 py-6 space-y-6">

        {/* Smart Brief - AI Generated Case Summary */}
        {(caseBrief || isLoadingBrief) && (
          <CaseBriefCard
            brief={caseBrief ?? null}
            isLoading={isLoadingBrief ?? false}
          />
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Age:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{profile.age} years</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Race:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{profile.race}</span>
          </div>
          <div className="flex items-start gap-2 text-sm col-span-2">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-gray-600 dark:text-gray-400">Address: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{profile.home_address}</span>
            </div>
          </div>
        </div>

        {/* Communication Preferences */}
        {profile.preferences && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Communication Preferences
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Preferred Method */}
              {profile.preferences.communication_method && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Preferred Method:
                  </p>
                  <Badge variant="primary" className="text-sm">
                    {profile.preferences.communication_method}
                  </Badge>
                </div>
              )}

              {/* Interpreter Needed */}
              {profile.preferences.requires_interpreter !== undefined && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Interpreter:
                  </p>
                  <Badge variant={needsInterpreter ? "danger" : "default"} className="text-sm">
                    {String(profile.preferences.requires_interpreter)}
                  </Badge>
                </div>
              )}

              {/* Speech Ability */}
              {profile.preferences.speech_ability && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    Speech Ability:
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile.preferences.speech_ability}
                  </p>
                </div>
              )}

              {/* Hearing Aid */}
              {profile.preferences.hearing_aid !== undefined && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Ear className="h-3 w-3" />
                    Hearing Aid:
                  </p>
                  <Badge variant={profile.preferences.hearing_aid ? "success" : "default"} className="text-sm">
                    {String(profile.preferences.hearing_aid) === 'true' ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}

              {/* Lip Reading */}
              {profile.preferences.lip_reading !== undefined && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Lip Reading:
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {String(profile.preferences.lip_reading)}
                  </p>
                </div>
              )}

              {/* Written Communication */}
              {profile.preferences.written_communication && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Written Communication:
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile.preferences.written_communication}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Communication Tips */}
        <div className="border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 bg-cyan-50/50 dark:bg-cyan-950/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Communication Tips for Officers
          </h3>
          <ul className="space-y-2">
            {communicationTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-cyan-600 dark:text-cyan-400 mt-0.5">•</span>
                <span className="text-gray-700 dark:text-gray-300">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Behavioral Guidance */}
        <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50/50 dark:bg-purple-950/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Behavioral Guidance
          </h3>
          <ul className="space-y-2">
            {behavioralTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span className="text-gray-700 dark:text-gray-300">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Patience Level (if specified) */}
        {profile.preferences?.patience_level && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Communication Pace:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {profile.preferences.patience_level}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        {profile.preferences?.notes && profile.preferences.notes.trim().length > 0 && (
          <div className="border-2 border-red-300 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Important Notes
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
              {profile.preferences.notes}
            </p>
          </div>
        )}

        {/* Emergency Contact */}
        <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
            Emergency Contact
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {profile.emergency_contact.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Relationship:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {profile.emergency_contact.relationship}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
              <a
                href={`tel:${profile.emergency_contact.phone}`}
                className="font-medium text-green-600 dark:text-green-400 hover:underline"
              >
                {profile.emergency_contact.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button onClick={onClose} variant="primary" size="lg" className="min-w-[200px]">
            <CheckCircle className="h-5 w-5 mr-2" />
            I Understand - Start Serving
          </Button>
        </div>

      </div>
    </Modal>
  );
}
