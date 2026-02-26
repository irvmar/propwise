import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger';
import type { SocialPlatform } from '../shared/types';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Map platforms to optimal aspect ratios for social media
const PLATFORM_ASPECT_RATIOS: Record<SocialPlatform, string> = {
  linkedin: '1:1',   // LinkedIn feed: 1200x1200 square performs best
  twitter: '16:9',   // Twitter/X feed: 1200x675 landscape
};

/**
 * Generate a social media post image using Nano Banana Pro 2
 * (gemini-3-pro-image-preview — Google's Gemini-based image generation model).
 *
 * Uses generateContent with responseModalities: ['IMAGE'] to produce images.
 * Returns base64-encoded PNG image data, or null if generation fails.
 *
 * Env var required: GOOGLE_API_KEY (Gemini API key from Google AI Studio)
 */
export async function generatePostImage(
  prompt: string,
  platform: SocialPlatform,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    logger.info('GOOGLE_API_KEY not set, skipping image generation');
    return null;
  }

  const ai = getClient();
  const aspectRatio = PLATFORM_ASPECT_RATIOS[platform];

  logger.info('Generating post image with Nano Banana Pro 2', { platform, aspectRatio });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize: '1K',
        },
      },
    });

    // Extract image from response parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          logger.info('Image generated successfully with Nano Banana Pro 2', { platform });
          return part.inlineData.data; // base64-encoded image
        }
      }
    }

    logger.warn('No image returned from Nano Banana Pro 2', { platform });
    return null;
  } catch (error) {
    logger.error('Nano Banana Pro 2 image generation failed', {
      platform,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
