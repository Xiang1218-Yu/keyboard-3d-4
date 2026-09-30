import { create } from 'zustand';
import { KeyboardState, KeyboardActions, LayoutType, CaseMaterial, KeyZone, BacklightSettings } from '@/types/keyboard';
import { DEFAULT_ZONE_COLORS } from '@/data/zones';
import { DEFAULT_BACKLIGHT, DEFAULT_BACKLIGHT_ZONE_COLORS } from '@/data/backlight';

interface KeyboardStore extends KeyboardState, KeyboardActions {}

export const useKeyboardStore = create<KeyboardStore>((set) => ({
  layout: '65%',
  caseMaterial: 'aluminum',
  zoneColors: { ...DEFAULT_ZONE_COLORS },
  backlight: {
    ...DEFAULT_BACKLIGHT,
    zoneColors: { ...DEFAULT_BACKLIGHT.zoneColors },
  },
  pressedKeys: new Set<string>(),

  setLayout: (layout: LayoutType) => {
    // 布局更换后旧布局的按键 id / 触发状态全部失效，清空避免残留动画
    set({ layout, pressedKeys: new Set<string>() });
  },

  setCaseMaterial: (caseMaterial: CaseMaterial) => {
    set({ caseMaterial });
  },

  setZoneColor: (zone: KeyZone, color: string) => {
    set((state) => ({
      zoneColors: {
        ...state.zoneColors,
        [zone]: color,
      },
    }));
  },

  pressKey: (keyId: string) => {
    set((state) => {
      if (state.pressedKeys.has(keyId)) return state;
      const newPressedKeys = new Set(state.pressedKeys);
      newPressedKeys.add(keyId);
      return { pressedKeys: newPressedKeys };
    });
  },

  releaseKey: (keyId: string) => {
    set((state) => {
      if (!state.pressedKeys.has(keyId)) return state;
      const newPressedKeys = new Set(state.pressedKeys);
      newPressedKeys.delete(keyId);
      return { pressedKeys: newPressedKeys };
    });
  },

  resetColors: () => {
    set({ zoneColors: { ...DEFAULT_ZONE_COLORS } });
  },

  setBacklight: (patch: Partial<BacklightSettings>) => {
    set((state) => ({
      backlight: { ...state.backlight, ...patch },
    }));
  },

  setBacklightZoneColor: (zone: KeyZone, color: string) => {
    set((state) => ({
      backlight: {
        ...state.backlight,
        zoneColors: {
          ...state.backlight.zoneColors,
          [zone]: color,
        },
      },
    }));
  },

  resetBacklightColors: () => {
    set((state) => ({
      backlight: {
        ...state.backlight,
        zoneColors: { ...DEFAULT_BACKLIGHT_ZONE_COLORS },
        customColor: DEFAULT_BACKLIGHT.customColor,
      },
    }));
  },
}));

export const useLayout = () => useKeyboardStore((state) => state.layout);
export const useCaseMaterial = () => useKeyboardStore((state) => state.caseMaterial);
export const useZoneColors = () => useKeyboardStore((state) => state.zoneColors);
export const usePressedKeys = () => useKeyboardStore((state) => state.pressedKeys);
export const useBacklight = () => useKeyboardStore((state) => state.backlight);
export const useIsKeyPressed = (keyId: string) =>
  useKeyboardStore((state) => state.pressedKeys.has(keyId));
