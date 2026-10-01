'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
type Pointer = React.RefObject<{ x: number; y: number }>;
const ivory = '#f5efe2',
  violet = '#7955b4',
  sage = '#a5b69f';
function Block({
  size,
  position = [0, 0, 0],
  color = ivory,
  radius = 0.08,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
  radius?: number;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={radius}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.02} />
    </RoundedBox>
  );
}
/** Deliberately incomplete, unencoded grid: a visual QR cue, never a customer URL. */
function PrintedPattern() {
  const cells = useMemo(() => {
    const coordinates: [number, number][] = [];
    for (let y = 0; y < 15; y++)
      for (let x = 0; x < 15; x++) {
        const finder = [
          [0, 0],
          [10, 0],
          [0, 10],
        ].find(([a, b]) => x >= a && x < a + 5 && y >= b && y < b + 5);
        const ink = finder
          ? x === finder[0] ||
            x === finder[0] + 4 ||
            y === finder[1] ||
            y === finder[1] + 4 ||
            (x === finder[0] + 2 && y === finder[1] + 2)
          : (x * 11 + y * 7 + x * y) % 5 < 2 && x !== 7;
        if (ink) coordinates.push([x, y]);
      }
    return coordinates;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const matrix = new THREE.Matrix4();
    cells.forEach(([x, y], i) =>
      ref.current?.setMatrixAt(
        i,
        matrix.makeTranslation((x - 7) * 0.066, (7 - y) * 0.066, 0),
      ),
    );
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [cells]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, cells.length]}
      position={[0, -0.12, 0.15]}
    >
      <boxGeometry args={[0.058, 0.058, 0.008]} />
      <meshStandardMaterial color={violet} roughness={0.8} />
    </instancedMesh>
  );
}
function Star() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 0.035 : 0.08;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }, []);
  return (
    <mesh>
      <extrudeGeometry args={[shape, { depth: 0.015, bevelEnabled: false }]} />
      <meshStandardMaterial color={violet} roughness={0.6} />
    </mesh>
  );
}
function Composition({ pointer }: { pointer: Pointer }) {
  const group = useRef<THREE.Group>(null),
    bubble = useRef<THREE.Group>(null),
    review = useRef<THREE.Group>(null);
  const time = useRef(0),
    frames = useRef(0);
  const { gl } = useThree();
  const tail = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.62, -0.32);
    shape.lineTo(-0.61, -0.58);
    shape.lineTo(-0.28, -0.32);
    shape.closePath();
    return shape;
  }, []);
  useFrame((_, delta) => {
    // Local time stops with rendering; no jump after a hidden tab resumes.
    time.current += Math.min(delta, 0.05);
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        pointer.current.x * 0.11,
        5,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        pointer.current.y * 0.055,
        5,
        delta,
      );
    }
    if (bubble.current)
      bubble.current.position.y = 0.83 + Math.sin(time.current * 0.8) * 0.025;
    if (review.current)
      review.current.position.y =
        -0.66 + Math.sin(time.current * 0.65 + 1) * 0.02;
    frames.current++;
    gl.domElement.dataset.frames = String(frames.current);
    gl.domElement.dataset.rotation = JSON.stringify([
      group.current?.rotation.x || 0,
      group.current?.rotation.y || 0,
    ]);
    gl.domElement.dataset.float = String(bubble.current?.position.y || 0);
  });
  return (
    <group ref={group} position={[0, 0.05, 0]} scale={1.15}>
      <group rotation={[0, -0.32, 0]}>
        <Block
          size={[2.2, 0.18, 1.04]}
          position={[0, -1.46, 0.04]}
          radius={0.08}
        />
        <group position={[0, -0.1, 0]} rotation={[-0.1, 0, 0]}>
          <Block size={[1.84, 2.5, 0.17]} radius={0.12} />
          <Block
            size={[1.6, 2.24, 0.025]}
            position={[0, 0, 0.105]}
            color="#fffdf6"
            radius={0.08}
          />
          <Block
            size={[1.35, 0.035, 0.015]}
            position={[0, 0.96, 0.13]}
            color={violet}
            radius={0.012}
          />
          <Block
            size={[0.5, 0.04, 0.01]}
            position={[0, 0.7, 0.13]}
            color={sage}
            radius={0.015}
          />
          <PrintedPattern />
          <Block
            size={[0.92, 0.035, 0.01]}
            position={[0, -0.81, 0.13]}
            color={sage}
            radius={0.012}
          />
          <Block
            size={[0.63, 0.025, 0.01]}
            position={[0, -0.92, 0.13]}
            color="#c8c1b6"
            radius={0.009}
          />
        </group>
      </group>
      <group
        ref={bubble}
        position={[-1.12, 0.83, 0.65]}
        rotation={[0, 0.12, 0.09]}
      >
        <Block size={[1.68, 0.81, 0.18]} color="#f8f3e9" radius={0.16} />
        <mesh position={[0, 0, -0.03]}>
          <extrudeGeometry
            args={[tail, { depth: 0.14, bevelEnabled: false }]}
          />
          <meshStandardMaterial color="#f8f3e9" roughness={0.65} />
        </mesh>
        <mesh position={[-0.57, 0.15, 0.105]}>
          <circleGeometry args={[0.068, 24]} />
          <meshStandardMaterial color={violet} />
        </mesh>
        <Block
          size={[0.92, 0.038, 0.016]}
          position={[0.07, 0.15, 0.105]}
          color={sage}
          radius={0.015}
        />
        <Block
          size={[1.15, 0.038, 0.016]}
          position={[0, -0.065, 0.105]}
          color={sage}
          radius={0.015}
        />
        <Block
          size={[0.76, 0.03, 0.016]}
          position={[-0.2, -0.22, 0.105]}
          color="#c6cbbb"
          radius={0.012}
        />
      </group>
      <group
        ref={review}
        position={[1.22, -0.66, 0.8]}
        rotation={[0, -0.12, -0.1]}
      >
        <Block size={[1.55, 0.72, 0.16]} color="#faf5eb" radius={0.12} />
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[-0.52 + i * 0.26, 0.11, 0.09]}>
            <Star />
          </group>
        ))}
        <Block
          size={[1.08, 0.035, 0.012]}
          position={[0, -0.15, 0.09]}
          color={sage}
          radius={0.013}
        />
      </group>
      <group position={[0, 0, -0.55]} rotation={[0, 0, -0.16]}>
        {[1.7, 2.02, 2.34].map((radius, i) => (
          <mesh key={radius} scale={[1, 0.86, 1]}>
            <torusGeometry args={[radius, 0.007, 6, 96]} />
            <meshStandardMaterial
              color={i === 1 ? sage : violet}
              transparent
              opacity={0.18}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
function Lifecycle({
  onReady,
  onFailure,
  active,
}: {
  active: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const { gl, invalidate, camera, size } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = size.width / 5.8;
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, invalidate]);
  const callbacks = useRef({ onReady, onFailure });
  callbacks.current = { onReady, onFailure };
  useEffect(() => {
    gl.domElement.dataset.art = 'RevuPing procedural scene';
    const lost = (event: Event) => {
      event.preventDefault();
      callbacks.current.onFailure();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    const frame = requestAnimationFrame(() => {
      invalidate();
      callbacks.current.onReady();
    });
    return () => {
      cancelAnimationFrame(frame);
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [gl, invalidate]);
  useEffect(() => {
    if (!active) return undefined;
    // Cap decorative rendering at 30fps; no timer runs offscreen or hidden.
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [active, invalidate]);
  return null;
}
export default function HeroScene({
  active,
  pointer,
  onReady,
  onFailure,
}: {
  active: boolean;
  pointer: Pointer;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0.65, 7], zoom: 92, near: 0.1, far: 30 }}
      dpr={[1, 1.5]}
      frameloop={active ? 'demand' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      fallback={null}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#fff7e6', '#b9adc8', 0.9]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.3} />
      <directionalLight position={[4, 2, -2]} color="#d3b6f2" intensity={1.2} />
      <Composition pointer={pointer} />
      <ContactShadows
        position={[0, -1.74, 0]}
        scale={8}
        opacity={0.3}
        blur={2.8}
        far={4}
        resolution={256}
        frames={1}
      />
      <Lifecycle active={active} onReady={onReady} onFailure={onFailure} />
    </Canvas>
  );
}
