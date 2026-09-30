import {
  BacklightEffect,
  BacklightSettings,
  KeyZone,
} from '@/types/keyboard';

export const BACKLIGHT_EFFECTS: { id: BacklightEffect; name: string }[] = [
  { id: 'static', name: '静态' },
  { id: 'breathing', name: '呼吸' },
  { id: 'rainbow', name: '彩虹' },
  { id: 'wave', name: '波浪' },
  { id: 'reactive', name: '按键触发' },
  { id: 'marquee', name: '跑马灯' },
];

export const DEFAULT_BACKLIGHT_ZONE_COLORS: Record<KeyZone, string> = {
  alphanumeric: '#ff3b5c',
  function: '#3b82f6',
  navigation: '#22c55e',
  numpad: '#a855f7',
  modifiers: '#f59e0b',
  spacebar: '#06b6d4',
};

export const DEFAULT_BACKLIGHT: BacklightSettings = {
  enabled: false,
  brightness: 0.8,
  effect: 'breathing',
  speed: 1,
  bloomIntensity: 1,
  colorMode: 'zones',
  zoneColors: { ...DEFAULT_BACKLIGHT_ZONE_COLORS },
  customColor: '#6366f1',
};
