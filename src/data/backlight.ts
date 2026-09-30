import { BacklightConfig, BacklightEffect, KeyZone } from '@/types/keyboard';

export interface BacklightEffectMeta {
  id: BacklightEffect;
  name: string;
  description: string;
}

export const BACKLIGHT_EFFECTS: BacklightEffectMeta[] = [
  { id: 'static', name: '静态', description: '常亮单色，不随时间变化' },
  { id: 'breathing', name: '呼吸', description: '明暗渐变，缓慢呼吸' },
  { id: 'rainbow', name: '彩虹', description: '色相循环，横向渐变' },
  { id: 'wave', name: '波浪', description: '光波横向扫过键盘' },
  { id: 'reactive', name: '按键触发', description: '按下的键点亮并淡出' },
  { id: 'marquee', name: '跑马灯', description: '光点沿键位巡回流动' },
];

export const DEFAULT_BACKLIGHT_ZONE_COLORS: Record<KeyZone, string> = {
  alphanumeric: '#6366f1',
  function: '#ec4899',
  navigation: '#06b6d4',
  numpad: '#22c55e',
  modifiers: '#f59e0b',
  spacebar: '#a855f7',
};

export const DEFAULT_BACKLIGHT: BacklightConfig = {
  enabled: false,
  brightness: 0.85,
  effect: 'rainbow',
  speed: 1,
  bloomIntensity: 0.9,
  zoneColors: { ...DEFAULT_BACKLIGHT_ZONE_COLORS },
};
