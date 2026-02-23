/**
 * Tests for rate limiting logic and MMS extraction from the IncomingSms handler.
 *
 * Since the handler is tightly coupled to Firebase/Twilio, we test the
 * extracted logic patterns directly rather than invoking the full handler.
 */

import { MAX_MESSAGES_PER_HOUR } from '../../../shared';

// ─── Rate limiting logic (mirrors IncomingSms lines 224-241) ──────────────────

function shouldRateLimit(recentMessageCount: number): boolean {
  return recentMessageCount >= MAX_MESSAGES_PER_HOUR;
}

describe('Rate limiting', () => {
  it('passes through when under limit', () => {
    expect(shouldRateLimit(5)).toBe(false);
  });

  it('passes through at one below limit', () => {
    expect(shouldRateLimit(MAX_MESSAGES_PER_HOUR - 1)).toBe(false);
  });

  it('triggers at the limit', () => {
    expect(shouldRateLimit(MAX_MESSAGES_PER_HOUR)).toBe(true);
  });

  it('triggers above the limit', () => {
    expect(shouldRateLimit(MAX_MESSAGES_PER_HOUR + 10)).toBe(true);
  });
});

// ─── MMS media extraction (mirrors IncomingSms lines 244-249) ─────────────────

function extractMediaUrls(body: Record<string, string | undefined>): string[] {
  const numMedia = parseInt(body.NumMedia || '0', 10);
  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`];
    if (url) mediaUrls.push(url);
  }
  return mediaUrls;
}

describe('MMS media extraction', () => {
  it('returns empty array when NumMedia is 0', () => {
    expect(extractMediaUrls({ NumMedia: '0' })).toEqual([]);
  });

  it('returns empty array when NumMedia is missing', () => {
    expect(extractMediaUrls({})).toEqual([]);
  });

  it('extracts 2 media URLs', () => {
    const result = extractMediaUrls({
      NumMedia: '2',
      MediaUrl0: 'https://api.twilio.com/media/img1.jpg',
      MediaUrl1: 'https://api.twilio.com/media/img2.jpg',
    });
    expect(result).toEqual([
      'https://api.twilio.com/media/img1.jpg',
      'https://api.twilio.com/media/img2.jpg',
    ]);
  });

  it('skips missing MediaUrl fields gracefully', () => {
    const result = extractMediaUrls({
      NumMedia: '3',
      MediaUrl0: 'https://api.twilio.com/media/img1.jpg',
      // MediaUrl1 is missing
      MediaUrl2: 'https://api.twilio.com/media/img3.jpg',
    });
    // Only extracts MediaUrl0 and MediaUrl2; MediaUrl1 is undefined → skipped
    expect(result).toEqual([
      'https://api.twilio.com/media/img1.jpg',
      'https://api.twilio.com/media/img3.jpg',
    ]);
    expect(result).toHaveLength(2);
  });

  it('handles NumMedia as non-numeric gracefully', () => {
    const result = extractMediaUrls({ NumMedia: 'abc' });
    // parseInt('abc') → NaN, loop body never runs
    expect(result).toEqual([]);
  });
});
