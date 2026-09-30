import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KeyConfig } from '@/types/keyboard';
import { useKeyboardStore, useLayout } from '@/store/useKeyboardStore';
import { LAYOUT_CONFIGS } from '@/data/layouts';
import { computeKeyGlow } from '@/lib/backlightEffects';

interface KeyGlowProps {
  id: string;
  keyConfig: KeyConfig;
  registerMaterial: (id: string, material: THREE.MeshStandardMaterial | null) => void;
}

/**
 * A single per-key RGB backlight slab. It lives underneath the keycap and
 * never touches the keycap's own material, so the keycap color is preserved.
 */
const KeyGlow = memo(function KeyGlow({ id, keyConfig, registerMaterial }: KeyGlowProps) {
  return (
    <group
      position={[
        keyConfig.x + keyConfig.width / 2,
        0,
        keyConfig.y + keyConfig.height / 2,
      ]}
    >
      <mesh position={[0, -0.26, 0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[keyConfig.width * 0.98, 0.06, keyConfig.height * 0.98]} />
        <meshStandardMaterial
          ref={(material) => registerMaterial(id, material)}
          color="#000000"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
});

export function Backlight() {
  const layout = useLayout();
  const layoutConfig = LAYOUT_CONFIGS[layout];
  const backlight = useKeyboardStore((state) => state.backlight);

  const materialMapRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
  const flashRef = useRef<Map<string, number>>(new Map());
  const orderRef = useRef<Map<string, number>>(new Map());
  const colorRef = useRef<THREE.Color>(new THREE.Color());
  const prevLayoutRef = useRef(layout);

  // Layout switch: reset per-key caches during render (before commit) so the
  // newly mounted glows register into fresh maps and no stale material is kept.
  if (prevLayoutRef.current !== layout) {
    prevLayoutRef.current = layout;
    materialMapRef.current = new Map();
    flashRef.current = new Map();
    const order = new Map<string, number>();
    const sorted = [...layoutConfig.keys].sort((a, b) => a.row - b.row || a.x - b.x);
    sorted.forEach((key, index) => order.set(key.id, index));
    orderRef.current = order;
  }

  // Reactive effect: record the timestamp of every newly pressed key.
  // Both 3D clicks and the physical keyboard hook go through pressKey, so a
  // single subscription keeps the two input entries consistent. No React
  // re-render per keypress — timestamps live in a ref.
  useEffect(() => {
    const unsubscribe = useKeyboardStore.subscribe((state, prevState) => {
      state.pressedKeys.forEach((id) => {
        if (!prevState.pressedKeys.has(id)) {
          flashRef.current.set(id, performance.now());
        }
      });
    });
    return unsubscribe;
  }, []);

  const registerMaterial = useCallback(
    (id: string, material: THREE.MeshStandardMaterial | null) => {
      if (material) {
        materialMapRef.current.set(id, material);
      } else {
        materialMapRef.current.delete(id);
      }
    },
    []
  );

  useFrame(() => {
    const { enabled, brightness, effect, zoneColors, speed } = backlight;
    const t = performance.now() / 1000;
    const keys = layoutConfig.keys;
    const mats = materialMapRef.current;
    const out = colorRef.current;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const material = mats.get(key.id);
      if (!material) continue;

      // When disabled, force every glow to zero so no stale animation/light
      // survives in the scene (the layer is also unmounted below).
      if (!enabled) {
        material.emissiveIntensity = 0;
        continue;
      }

      const intensity = computeKeyGlow(key, i, keys, t, {
        brightness,
        speed,
        effect,
        zoneColors,
        flash: flashRef.current.get(key.id) ?? 0,
        orderIndex: orderRef.current.get(key.id) ?? 0,
        layoutWidth: layoutConfig.width,
      }, out);

      material.emissive.copy(out);
      material.emissiveIntensity = intensity;
    }
  });

  const glows = useMemo(
    () =>
      layoutConfig.keys.map((key) => (
        <KeyGlow
          key={key.id}
          id={key.id}
          keyConfig={key}
          registerMaterial={registerMaterial}
        />
      )),
    [layoutConfig.keys, registerMaterial]
  );

  // Unmount the whole layer when off: geometries/materials are disposed by
  // R3F and no glow remains for Bloom to pick up.
  if (!backlight.enabled) return null;

  return <group name="rgb-backlight">{glows}</group>;
}
