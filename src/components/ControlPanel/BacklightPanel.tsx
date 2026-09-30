import {
  Lightbulb,
  Droplet,
  Activity,
  Rainbow,
  Waves,
  Zap,
  ChevronsRight,
  RotateCcw,
  Gauge,
  Sun,
  Sparkles,
} from 'lucide-react';
import { useKeyboardStore } from '@/store/useKeyboardStore';
import { BACKLIGHT_EFFECTS } from '@/data/backlight';
import { ZONE_LIST, ZONE_CONFIGS } from '@/data/zones';
import { PRESET_COLORS } from '@/data/materials';
import { BacklightEffect, KeyZone } from '@/types/keyboard';

const EFFECT_ICONS: Record<BacklightEffect, typeof Droplet> = {
  static: Droplet,
  breathing: Activity,
  rainbow: Rainbow,
  wave: Waves,
  reactive: Zap,
  marquee: ChevronsRight,
};

interface SliderRowProps {
  icon: typeof Sun;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderRow({ icon: Icon, label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="text-xs text-indigo-300 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700/60 rounded-full appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );
}

export function BacklightPanel() {
  const backlight = useKeyboardStore((s) => s.backlight);
  const setBacklight = useKeyboardStore((s) => s.setBacklight);
  const setBacklightZoneColor = useKeyboardStore((s) => s.setBacklightZoneColor);
  const resetBacklightColors = useKeyboardStore((s) => s.resetBacklightColors);

  const { enabled } = backlight;

  return (
    <div className={enabled ? '' : 'opacity-70'}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb
            className={`w-4 h-4 transition-colors ${
              enabled ? 'text-amber-300' : 'text-gray-500'
            }`}
          />
          <h3 className="text-sm font-medium text-gray-200">RGB 背光</h3>
        </div>

        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setBacklight({ enabled: !enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            enabled ? 'bg-indigo-500' : 'bg-gray-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!enabled && (
        <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30 text-center">
          <div className="text-gray-500 text-xs">背光已关闭，开启后按键缝隙将亮起 RGB 灯效</div>
        </div>
      )}

      {enabled && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 灯效选择 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              灯效模式
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {BACKLIGHT_EFFECTS.map(({ id, name }) => {
                const Icon = EFFECT_ICONS[id];
                const isActive = backlight.effect === id;
                return (
                  <button
                    key={id}
                    onClick={() => setBacklight({ effect: id })}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50'
                        : 'bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 参数滑块 */}
          <div className="space-y-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
            <SliderRow
              icon={Sun}
              label="亮度"
              value={backlight.brightness}
              min={0.1}
              max={2}
              step={0.05}
              onChange={(v) => setBacklight({ brightness: v })}
            />
            <SliderRow
              icon={Activity}
              label="动画速度"
              value={backlight.speed}
              min={0.2}
              max={3}
              step={0.1}
              onChange={(v) => setBacklight({ speed: v })}
            />
            <SliderRow
              icon={Gauge}
              label="Bloom 辉光强度"
              value={backlight.bloomIntensity}
              min={0}
              max={3}
              step={0.05}
              onChange={(v) => setBacklight({ bloomIntensity: v })}
            />
          </div>

          {/* 配色方式：分区联动 / 独立单色 */}
          <div>
            <div className="text-xs text-gray-400 mb-2">配色方式</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'zones', name: '分区联动' },
                  { id: 'custom', name: '独立单色' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setBacklight({ colorMode: mode.id })}
                  className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                    backlight.colorMode === mode.id
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                      : 'bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60'
                  }`}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          </div>

          {backlight.colorMode === 'custom' ? (
            <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-2">所有按键统一颜色</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backlight.customColor}
                  onChange={(e) => setBacklight({ customColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  defaultValue={backlight.customColor}
                  key={backlight.customColor}
                  onBlur={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      setBacklight({ customColor: e.target.value });
                    } else {
                      e.target.value = backlight.customColor;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="flex-1 px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="grid grid-cols-9 gap-1.5 mt-3">
                {PRESET_COLORS.slice(0, 18).map((color) => (
                  <button
                    key={color}
                    onClick={() => setBacklight({ customColor: color })}
                    className="aspect-square rounded-md border border-transparent hover:border-gray-400 hover:scale-110 transition-all duration-150"
                    style={{
                      backgroundColor: color,
                      boxShadow:
                        backlight.customColor.toLowerCase() === color.toLowerCase()
                          ? `0 0 10px ${color}`
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">各分区背光颜色</div>
                <button
                  onClick={resetBacklightColors}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置
                </button>
              </div>
              <div className="space-y-1.5">
                {ZONE_LIST.map((zone: KeyZone) => (
                  <div
                    key={zone}
                    className="flex items-center justify-between px-3 py-1.5 bg-gray-800/40 rounded-lg border border-gray-700/30"
                  >
                    <span className="text-xs text-gray-300">{ZONE_CONFIGS[zone].name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {backlight.zoneColors[zone]}
                      </span>
                      <input
                        type="color"
                        value={backlight.zoneColors[zone]}
                        onChange={(e) => setBacklightZoneColor(zone, e.target.value)}
                        className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
