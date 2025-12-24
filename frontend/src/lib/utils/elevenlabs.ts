/**
 * ElevenLabs Text-to-Speech utility
 * Converts text to speech using ElevenLabs API
 */

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
}

/**
 * Convert text to speech using ElevenLabs API
 *
 * @param text The text to convert to speech
 * @param config ElevenLabs configuration (API key and voice ID)
 * @returns Audio blob
 */
export async function textToSpeech(
  text: string,
  config?: Partial<ElevenLabsConfig>
): Promise<Blob> {
  // Use environment variable or provided API key
  const apiKey = config?.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Use environment variable or provided voice ID
  // Defaults to Rachel voice if not configured
  const voiceId = config?.voiceId || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Supports Malay
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw error;
  }
}

/**
 * Play audio from blob
 *
 * @param audioBlob Audio blob to play
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudioBlob(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };

    audio.play().catch(reject);
  });
}

/**
 * Speak text using ElevenLabs TTS
 *
 * @param text The text to speak
 * @param config ElevenLabs configuration (API key and voice ID)
 * @returns Promise that resolves when speech finishes
 */
export async function speak(
  text: string,
  config?: Partial<ElevenLabsConfig>
): Promise<void> {
  try {
    console.log('🔊 Speaking:', text);
    const audioBlob = await textToSpeech(text, config);
    await playAudioBlob(audioBlob);
    console.log('✅ Speech completed');
  } catch (error) {
    console.error('❌ Speech failed:', error);
    throw error;
  }
}
