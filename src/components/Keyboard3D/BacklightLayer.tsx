import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KeyConfig } from '@/types/keyboard';
import { useKeyboardStore } from '@/store/useKeyboardStore';

interface BacklightLayerProps {
  keys: KeyConfig[];
  layoutWidth: number;
  layoutHeight: number;
}

const GLOW_SCALE = 1.6; // 允许颜色强度超过 1，配合 Bloom 产生真正的辉光
const GLOW_SIZE = 1.12; // 比键帽(0.92)略大，从四周缝隙露出一圈光晕

/**
 * 独立 RGB 背光层：
 * - 每个键帽位置放一块加法混合的发光平面，只做光，绝不修改键帽材质本色；
 * - 单一 useFrame 循环驱动静态 / 呼吸 / 彩虹 / 波浪 / 按键触发 / 跑马灯；
 * - 关闭开关、切换效果、更换布局、卸载时都会清扫材质与余波，杜绝旧动画残留。
 */
export function BacklightLayer({ keys, layoutWidth, layoutHeight }: BacklightLayerProps) {
  const enabled = useKeyboardStore((s) => s.backlight.enabled);
  const colorMode = useKeyboardStore((s) => s.backlight.colorMode);
  const customColor = useKeyboardStore((s) => s.backlight.customColor);
  const zoneColors = useKeyboardStore((s) => s.backlight.zoneColors);
  const effect = useKeyboardStore((s) => s.backlight.effect);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // 每键常驻基准色（分区联动 / 独立单色），仅在设置变化时重建
  const baseColors = useMemo(
    () =>
      keys.map((k) =>
        new THREE.Color(colorMode === 'zones' ? zoneColors[k.zone] : customColor)
      ),
    [keys, colorMode, customColor, zoneColors]
  );

  // 跑马灯蛇形顺序：奇数行反向，形成逐行来回扫描
  const snakeIndex = useMemo(() => {
    const order = [...keys].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.row % 2 === 0 ? a.col - b.col : b.col - a.col;
    });
    const indexById = new Map<string, number>();
    order.forEach((k, i) => indexById.set(k.id, i));
    return keys.map((k) => indexById.get(k.id) ?? 0);
  }, [keys]);

  // 可变动画状态（放在 ref 里，不触发 React 渲染）
  const animTime = useRef(0);
  const trails = useRef<number[]>(keys.map(() => 0));

  const tmpColor = useMemo(() => new THREE.Color(), []);
  const whiteColor = useMemo(() => new THREE.Color('#ffffff'), []);

  const sweepAll = () => {
    meshRefs.current.forEach((mesh) => {
      const mat = mesh?.material as THREE.MeshBasicMaterial | undefined;
      mat?.color.setRGB(0, 0, 0);
    });
  };

  // 更换布局或切换效果：清空按键余波并把所有材质抹黑，避免跨布局/跨效果残影
  useEffect(() => {
    trails.current = keys.map(() => 0);
    sweepAll();
  }, [keys, effect]);

  // 卸载兜底（R3F 会自动 dispose 几何体/材质，这里保证末帧不留亮色）
  useEffect(() => {
    return () => {
      sweepAll();
      trails.current = [];
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { backlight, pressedKeys } = useKeyboardStore.getState();
    const meshes = meshRefs.current;

    // 开关关闭：每帧清扫所有发光材质与余波，场景不再保留任何旧动画
    if (!backlight.enabled) {
      for (const mesh of meshes) {
        const mat = mesh?.material as THREE.MeshBasicMaterial | undefined;
        if (mat && (mat.color.r !== 0 || mat.color.g !== 0 || mat.color.b !== 0)) {
          mat.color.setRGB(0, 0, 0);
        }
      }
      if (trails.current.some((v) => v !== 0)) {
        trails.current = keys.map(() => 0);
      }
      return;
    }

    animTime.current += delta * backlight.speed;
    const t = animTime.current;
    const n = keys.length || 1;

    for (let i = 0; i < keys.length; i++) {
      const mesh = meshes[i];
      const mat = mesh?.material as THREE.MeshBasicMaterial | undefined;
      if (!mesh || !mat) continue;

      const key = keys[i];
      const kx = layoutWidth > 0 ? (key.x + key.width / 2) / layoutWidth : 0.5;
      const ky = layoutHeight > 0 ? (key.y + key.height / 2) / layoutHeight : 0.5;

      // 按键触发：按下瞬间亮起，松开后指数衰减（鼠标点击与物理键盘共用 pressedKeys）
      let trail = trails.current[i] ?? 0;
      if (pressedKeys.has(key.id)) {
        trail = Math.max(trail, 0.9);
      } else {
        trail *= Math.exp(-delta * 3.2);
        if (trail < 0.01) trail = 0;
      }
      trails.current[i] = trail;

      let m = 1;
      tmpColor.copy(baseColors[i]);

      switch (backlight.effect) {
        case 'static':
          m = 1;
          break;

        case 'breathing':
          m = 0.12 + 0.88 * (0.5 - 0.5 * Math.cos(t * 2));
          break;

        case 'rainbow': {
          const hue = (kx * 0.25 + ky * 0.12 + t * 0.12) % 1;
          tmpColor.setHSL((hue + 1) % 1, 1, 0.55);
          m = 1;
          break;
        }

        case 'wave': {
          const s = Math.sin(t * 2.2 + kx * 7 + ky * 2.5);
          m = 0.25 + 0.75 * (0.5 + 0.5 * s);
          const hue = (0.62 + kx * 0.25 + t * 0.06) % 1;
          tmpColor.setHSL((hue + 1) % 1, 1, 0.55);
          break;
        }

        case 'reactive':
          // 基础微光 + 触发高亮，越接近触发峰值越偏向白色
          m = 0.12 + trail * 1.1;
          tmpColor.lerp(whiteColor, Math.min(trail * 0.8, 0.85));
          break;

        case 'marquee': {
          const idx = snakeIndex[i] / n;
          const progress = (t * 0.22) % 1;
          const d = (progress - idx + 1) % 1;
          m = Math.exp(-Math.pow((d * n) / 2.4, 2));
          tmpColor.setHSL((idx + t * 0.08) % 1, 1, 0.55);
          break;
        }
      }

      const scale = GLOW_SCALE * backlight.brightness * Math.min(m, 1.4);
      mat.color.setRGB(
        tmpColor.r * scale,
        tmpColor.g * scale,
        tmpColor.b * scale
      );
    }
  });

  return (
    <group visible={enabled}>
      {keys.map((key, i) => (
        <mesh
          key={key.id}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[key.x + key.width / 2, -0.155, key.y + key.height / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
          renderOrder={2}
        >
          <planeGeometry args={[key.width * GLOW_SIZE, key.height * GLOW_SIZE]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
