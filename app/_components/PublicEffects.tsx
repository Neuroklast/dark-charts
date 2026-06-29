'use client';

import { VisualEffectsOverlay } from '@/components/VisualEffectsOverlay';
import { NavHidingWrapper } from './NavHidingWrapper';

export function PublicEffects() {
  return (
    <NavHidingWrapper>
      <VisualEffectsOverlay
        noiseOpacity={0.03}
        crtScanlinesEnabled
        vignetteIntensity={0.5}
      />
    </NavHidingWrapper>
  );
}