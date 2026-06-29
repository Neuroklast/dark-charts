'use client';

import type { CSSProperties } from 'react';
import type { ThemeEffects } from '@/config/themeConfig';

interface VisualEffectsOverlayProps {
  noiseOpacity: number;
  crtScanlinesEnabled: boolean;
  vignetteIntensity: number;
  effects?: ThemeEffects;
}

export function VisualEffectsOverlay({
  noiseOpacity,
  crtScanlinesEnabled,
  vignetteIntensity,
  effects,
}: VisualEffectsOverlayProps) {
  const chromaticEnabled = effects?.overlay?.chromaticAberration?.enabled ?? false;
  const chromaticIntensity = effects?.overlay?.chromaticAberration?.intensity ?? 2;
  const washEnabled = effects?.overlay?.colorWash?.enabled ?? false;
  const washColor = effects?.overlay?.colorWash?.color ?? 'transparent';
  const washOpacity = effects?.overlay?.colorWash?.opacity ?? 0;

  return (
    <>
      <div
        aria-hidden="true"
        className={`vfx-overlay${crtScanlinesEnabled ? ' vfx-scanlines' : ''}${chromaticEnabled ? ' vfx-chromatic' : ''}`}
        style={
          {
            '--vfx-noise-opacity': noiseOpacity,
            '--vfx-vignette-shadow': `rgba(0,0,0,${vignetteIntensity})`,
            '--vfx-vignette-grad': `rgba(0,0,0,${(vignetteIntensity * 0.65).toFixed(3)})`,
            '--fx-chromatic-offset': chromaticEnabled ? `${chromaticIntensity}px` : '0px',
          } as CSSProperties
        }
      />
      {washEnabled && (
        <div
          aria-hidden="true"
          className="vfx-color-wash"
          style={
            {
              '--fx-wash-color': washColor,
              '--fx-wash-opacity': washOpacity,
            } as CSSProperties
          }
        />
      )}
    </>
  );
}