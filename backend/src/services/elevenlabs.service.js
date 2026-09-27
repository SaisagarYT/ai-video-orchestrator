import axios from 'axios';
import { config } from '../config/env.js';
import { uploadBufferToCloudinary } from './cloudinary.service.js';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

/**
 * Generate high-fidelity TTS voiceover using ElevenLabs
 */
export const generateVoiceover = async ({ text, voiceId = DEFAULT_VOICE_ID }) => {
  if (!config.ai.elevenlabsApiKey) {
    console.warn('⚠️ ELEVENLABS_API_KEY not configured. Returning fallback commercial narration.');
    return {
      audioUrl: 'https://actions.google.com/sounds/v1/commercial/advertisement_sound_effects.ogg',
      durationSeconds: 5,
    };
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': config.ai.elevenlabsApiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    const buffer = Buffer.from(response.data);
    
    // Upload generated audio directly to Cloudinary CDN
    const uploadResult = await uploadBufferToCloudinary(buffer, {
      resource_type: 'video', // Cloudinary handles audio under resource_type 'video'
      folder: 'voiceovers',
      format: 'mp3',
    });

    return {
      audioUrl: uploadResult.secureUrl,
      durationSeconds: uploadResult.duration || 5,
    };
  } catch (err) {
    console.error('ElevenLabs Speech Generation Error:', err.response?.data || err.message);
    throw new Error(`Voiceover generation failed: ${err.message}`);
  }
};
