import {
  Lightbulb,
  Wind,
  Rainbow as RainbowIcon,
  Waves,
  Zap,
  MoveHorizontal,
  RotateCcw,
  Link2,
} from 'lucide-react';
import { useState } from 'react';
import { useKeyboardStore } from '@/store/useKeyboardStore';
import { BACKLIGHT_EFFECTS } from '@/data/backlight';
import { PRESET_COLORS } from '@/data/materials';
import { ZONE_LIST, ZONE_CONFIGS } from '@/data/zones';
import { BacklightEffect, KeyZone } from '@/types/keyboard';

const EFFECT_ICONS: Record<BacklightEffect, typeof Wind> = {
  static: Lightbulb,
  breathing: Wind,
  rainbow: RainbowIcon,
  wave: Waves,
  reactive: Zap,
  marquee: MoveHorizontal,
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="开关背光"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-indigo-500' : 'bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  disabled,
  format,
  onChange,
}: SliderProps) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-300 font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-700 accent-indigo-500 cursor-pointer"
      />
    </div>
  );
}

export function BacklightPanel() {
  const backlight = useKeyboardStore((state) => state.backlight);
  const setBacklightEnabled = useKeyboardStore((state) => state.setBacklightEnabled);
  const setBacklightBrightness = useKeyboardStore((state) => state.setBacklightBrightness);
  const setBacklightEffect = useKeyboardStore((state) => state.setBacklightEffect);
  const setBacklightSpeed = useKeyboardStore((state) => state.setBacklightSpeed);
  const setBloomIntensity = useKeyboardStore((state) => state.setBloomIntensity);
  const setBacklightZoneColor = useKeyboardStore((state) => state.setBacklightZoneColor);
  const syncBacklightColors = useKeyboardStore((state) => state.syncBacklightColors);
  const resetBacklight = useKeyboardStore((state) => state.resetBacklight);

  const [selectedZone, setSelectedZone] = useState<KeyZone | null>(null);
  const enabled = backlight.enabled;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-medium text-gray-200">RGB 背光</h3>
        </div>
        <Toggle checked={enabled} onChange={setBacklightEnabled} />
      </div>

      <div
        className={`space-y-4 transition-opacity duration-200 ${
          enabled ? '' : 'opacity-40 pointer-events-none'
        }`}
      >
        <div>
          <div className="text-xs text-gray-400 mb-2">灯效模式</div>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKLIGHT_EFFECTS.map((effectMeta) => {
              const Icon = EFFECT_ICONS[effectMeta.id];
              const isActive = backlight.effect === effectMeta.id;
              return (
                <button
                  key={effectMeta.id}
                  type="button"
                  onClick={() => setBacklightEffect(effectMeta.id)}
                  title={effectMeta.description}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {effectMeta.name}
                </button>
              );
            })}
          </div>
        </div>

        <Slider
          label="亮度"
          value={backlight.brightness}
          min={0.05}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={setBacklightBrightness}
        />
        <Slider
          label="速度"
          value={backlight.speed}
          min={0.2}
          max={2}
          step={0.1}
          disabled={backlight.effect === 'static'}
          format={(v) => `${v.toFixed(1)}x`}
          onChange={setBacklightSpeed}
        />
        <Slider
          label="Bloom 强度"
          value={backlight.bloomIntensity}
          min={0}
          max={2}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={setBloomIntensity}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400">分区灯色</div>
            <button
              type="button"
              onClick={syncBacklightColors}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-all"
            >
              <Link2 className="w-3 h-3" />
              同步键帽
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ZONE_LIST.map((zone) => {
              const config = ZONE_CONFIGS[zone];
              const isSelected = selectedZone === zone;
              const color = backlight.zoneColors[zone];
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(isSelected ? null : zone)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600/50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm border border-gray-600/50"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
                  />
                  {config.name}
                </button>
              );
            })}
          </div>

          {selectedZone && (
            <div className="mt-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30 space-y-3 animate-in fade-in duration-200">
              <div className="text-xs text-gray-400">
                当前分区:{' '}
                <span className="text-purple-300">{ZONE_CONFIGS[selectedZone].name}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backlight.zoneColors[selectedZone]}
                  onChange={(e) => setBacklightZoneColor(selectedZone, e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={backlight.zoneColors[selectedZone]}
                  onChange={(e) => setBacklightZoneColor(selectedZone, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="grid grid-cols-9 gap-1.5">
                {PRESET_COLORS.map((color) => {
                  const isActive =
                    backlight.zoneColors[selectedZone]?.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBacklightZoneColor(selectedZone, color)}
                      className={`aspect-square rounded-md border-2 transition-all duration-150 hover:scale-110 ${
                        isActive
                          ? 'border-white shadow-lg'
                          : 'border-transparent hover:border-gray-500'
                      }`}
                      style={{
                        backgroundColor: color,
                        boxShadow: isActive ? `0 0 12px ${color}80` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={resetBacklight}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 rounded-lg transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          重置背光
        </button>

        <p className="text-[11px] leading-relaxed text-gray-500">
          背光为独立发光层，不影响键帽本色；关闭后灯效立即停止，场景不留余光。
        </p>
      </div>
    </div>
  );
}
