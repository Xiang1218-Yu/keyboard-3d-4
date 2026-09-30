import * as THREE from 'three';
import { BacklightEffect, KeyConfig, KeyZone } from '@/types/keyboard';

export interface EffectParams {
  brightness: number;
  speed: number;
  effect: BacklightEffect;
  zoneColors: Record<KeyZone, string>;
  /** Timestamp (ms) of the last press for this key; 0 if never pressed. */
  flash: number;
  /** Index of the key in the marquee ordering. */
  orderIndex: number;
  layoutWidth: number;
}

const zoneColorTmp = new THREE.Color();

/**
 * Computes the emissive color and intensity for a single key at time t.
 * Writes the color into `out` and returns the intensity (0..1).
 * Pure apart from module-level temp colors to avoid per-frame allocations.
 */
export function computeKeyGlow(
  key: KeyConfig,
  index: number,
  keys: KeyConfig[],
  t: number,
  params: EffectParams,
  out: THREE.Color
): number {
  const { brightness, speed, effect, zoneColors, flash, orderIndex, layoutWidth } = params;
  zoneColorTmp.set(zoneColors[key.zone] ?? '#ffffff');

  switch (effect) {
    case 'static': {
      out.copy(zoneColorTmp);
      return brightness;
    }

    case 'breathing': {
      out.copy(zoneColorTmp);
      const breath = 0.5 + 0.5 * Math.sin(t * speed * 1.8);
      return brightness * (0.12 + 0.88 * breath * breath);
    }

    case 'rainbow': {
      const hue = (t * speed * 0.08 + (key.x / Math.max(layoutWidth, 1)) * 0.9) % 1;
      out.setHSL(((hue % 1) + 1) % 1, 1, 0.62);
      return brightness;
    }

    case 'wave': {
      out.copy(zoneColorTmp);
      const wave =
        0.5 + 0.5 * Math.sin(key.x * 0.7 - t * speed * 3.2 + key.y * 0.5);
      return brightness * (0.15 + 0.85 * wave * wave);
    }

    case 'reactive': {
      out.copy(zoneColorTmp);
      const age = (performance.now() - flash) / 1000;
      const decay = Math.max(0, 1 - age * (2.4 - Math.min(speed, 2) * 0.6));
      return brightness * (0.08 + 0.92 * decay * decay);
    }

    case 'marquee': {
      const count = keys.length;
      const head = (t * speed * 10) % count;
      let dist = orderIndex - head;
      if (dist < 0) dist += count;
      const trail = Math.max(0, 1 - dist / 7);
      const hue = (t * speed * 0.05 + orderIndex / count) % 1;
      out.setHSL(((hue % 1) + 1) % 1, 1, 0.6);
      return brightness * trail;
    }
  }
}
