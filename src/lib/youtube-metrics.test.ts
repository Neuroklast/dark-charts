import { describe, it, expect } from 'vitest';
import { blendStreamingPopularity } from './youtube-metrics';

describe('youtube-metrics', () => {
  it('blends spotify and youtube popularity', () => {
    expect(blendStreamingPopularity(80, 0)).toBe(80);
    expect(blendStreamingPopularity(80, 60)).toBe(77);
    expect(blendStreamingPopularity(0, 50)).toBe(50);
  });
});