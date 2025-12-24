import { UserProfile } from '@/components/profile/UserProfile';

/**
 * Generate personalized communication tips based on user's profile and preferences
 */
export function generateCommunicationTips(profile: UserProfile): string[] {
  const tips: string[] = [];

  if (!profile.preferences) {
    return ['No specific communication preferences on file. Use standard deaf communication protocols.'];
  }

  const prefs = profile.preferences;

  // Speech ability tips
  if (prefs.speech_ability) {
    const speechStr = prefs.speech_ability.toLowerCase();

    if (speechStr.includes('cannot speak') || speechStr.includes('no speech')) {
      tips.push('User cannot speak verbally - use sign language or written communication only');
    } else if (speechStr.includes('limited') || speechStr.includes('minimal')) {
      tips.push('User has limited speech ability - be patient and allow extra time for verbal responses');
    } else if (speechStr.includes('can speak') || speechStr.includes('clear')) {
      tips.push('User can speak verbally - you may receive verbal responses');
    }
  }

  // Lip reading tips
  if (prefs.lip_reading) {
    const lipReadingStr = String(prefs.lip_reading).toLowerCase();

    if (lipReadingStr === 'true' || lipReadingStr.includes('yes') || lipReadingStr.includes('proficient')) {
      tips.push('Face the user directly when speaking - they rely on lip reading');
      tips.push('Speak clearly at a normal pace - avoid exaggerated mouth movements');
      tips.push('Do not cover your mouth with hands or objects while speaking');
    } else if (lipReadingStr.includes('basic') || lipReadingStr.includes('some')) {
      tips.push('User has basic lip reading skills - face them when speaking, but do not rely on this alone');
    }
  }

  // Communication method tips
  if (prefs.communication_method) {
    const methodStr = prefs.communication_method.toLowerCase();

    if (methodStr.includes('bim') || methodStr.includes('sign language')) {
      tips.push('Primary method: Malaysian Sign Language (BIM) - use this app\'s sign interpreter');
    }

    if (methodStr.includes('written')) {
      tips.push('Written communication accepted - type your message if sign language is unavailable');
    }

    if (methodStr.includes('clear speech') || methodStr.includes('speech')) {
      tips.push('User can understand clear speech - speak slowly and distinctly');
    }
  }

  // Interpreter tips
  if (prefs.requires_interpreter) {
    const interpreterStr = String(prefs.requires_interpreter).toLowerCase();

    if (interpreterStr === 'true' || interpreterStr.includes('yes') || interpreterStr.includes('required')) {
      tips.push('Professional interpreter required for complex conversations');
      tips.push('Use this app for basic interactions, but consider calling an interpreter for detailed matters');
    } else if (interpreterStr.includes('optional') || interpreterStr.includes('prefer')) {
      tips.push('Interpreter is optional but preferred when available for complex topics');
    }
  }

  // Hearing aid tips
  if (prefs.hearing_aid === true || String(prefs.hearing_aid).toLowerCase() === 'true') {
    tips.push('User wears hearing aid - reduce background noise and speak slightly louder');
    tips.push('Face the user when speaking - hearing aid works best with visual cues');
  } else if (prefs.hearing_aid === false || String(prefs.hearing_aid).toLowerCase() === 'false') {
    tips.push('User does not wear hearing aid - rely primarily on visual communication methods');
  }

  // Written communication tips
  if (prefs.written_communication) {
    tips.push(`Written communication: ${prefs.written_communication}`);
  }

  // If no specific tips generated, add default
  if (tips.length === 0) {
    tips.push('Use sign language interpreter or written communication');
    tips.push('Maintain visual contact and use clear gestures');
  }

  return tips;
}

/**
 * Generate behavioral guidance tips for officers to improve interaction quality
 */
export function generateBehavioralTips(profile: UserProfile): string[] {
  const tips: string[] = [];

  if (!profile.preferences) {
    return [
      'Maintain eye contact to show engagement',
      'Be patient and allow extra time for communication',
      'Ensure good lighting so user can see your face clearly',
    ];
  }

  const prefs = profile.preferences;

  // Patience level tips
  if (prefs.patience_level) {
    const patienceStr = prefs.patience_level.toLowerCase();

    if (patienceStr.includes('extra time') || patienceStr.includes('requires extra')) {
      tips.push('Allow extra time for responses - user needs more processing time');
      tips.push('Be patient and avoid rushing the conversation');
      tips.push('Pause between questions to give time for comprehension');
    } else if (patienceStr.includes('normal') || patienceStr.includes('standard')) {
      tips.push('Communicate at normal pace, but ensure clarity');
    }
  }

  // Visual attention tips
  if (prefs.visual_attention) {
    const visualStr = prefs.visual_attention.toLowerCase();

    if (visualStr.includes('eye contact')) {
      tips.push('Maintain consistent eye contact - user relies on visual cues');
    }

    if (visualStr.includes('facial expression')) {
      tips.push('Use clear facial expressions - they convey important emotional context');
      tips.push('Show emotion through your face - smile, nod, and react visually');
    }

    if (visualStr.includes('gesture') || visualStr.includes('hand')) {
      tips.push('Use natural hand gestures to emphasize key points');
      tips.push('Point to objects or documents when referencing them');
    }

    if (visualStr.includes('clear') || visualStr.includes('maintain')) {
      tips.push('Please maintain eye contact and clear facial expressions');
    }
  }

  // Environment and general behavioral tips (always include)
  tips.push('Ensure good lighting - user needs to see your face clearly');
  tips.push('Minimize distractions and background noise during interaction');
  tips.push('Get the user\'s attention before speaking (wave or tap desk gently)');
  tips.push('Be expressive with body language - use visual confirmation (thumbs up, nodding)');

  // If notes exist, they likely contain important behavioral guidance
  if (prefs.notes && prefs.notes.trim().length > 0) {
    // Notes are displayed separately in the modal, so just acknowledge their importance here
    tips.push('⚠️ Check Important Notes section below for specific instructions');
  }

  return tips;
}

/**
 * Get a summary of the user's communication capabilities
 */
export function getCommunicationSummary(profile: UserProfile): string {
  if (!profile.preferences) {
    return 'Communication preferences not specified. Use standard protocols.';
  }

  const prefs = profile.preferences;
  const parts: string[] = [];

  // Speech ability
  if (prefs.speech_ability) {
    parts.push(prefs.speech_ability);
  }

  // Hearing aid
  if (prefs.hearing_aid) {
    parts.push('uses hearing aid');
  }

  // Lip reading
  if (prefs.lip_reading && String(prefs.lip_reading).toLowerCase() !== 'false') {
    parts.push('can lip read');
  }

  // Preferred method
  if (prefs.communication_method) {
    parts.push(`prefers ${prefs.communication_method}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Use visual communication methods';
}

/**
 * Determine if user needs immediate interpreter assistance
 */
export function needsImmediateInterpreter(profile: UserProfile): boolean {
  if (!profile.preferences) {
    return false;
  }

  const prefs = profile.preferences;

  // Check if interpreter is explicitly required
  if (prefs.requires_interpreter === true ||
      String(prefs.requires_interpreter).toLowerCase().includes('required')) {
    return true;
  }

  // Check if user has no verbal speech ability
  if (prefs.speech_ability?.toLowerCase().includes('cannot speak')) {
    return true;
  }

  return false;
}

/**
 * Get color variant for disability level badge
 */
export function getDisabilityLevelVariant(disabilityLevel: string): 'success' | 'warning' | 'default' {
  const level = disabilityLevel.toLowerCase();

  if (level.includes('full deaf') || level.includes('completely deaf')) {
    return 'success'; // Green for full deaf
  } else if (level.includes('partial') || level.includes('moderate') || level.includes('severe')) {
    return 'warning'; // Amber for partial/moderate hearing loss
  }

  return 'default';
}
