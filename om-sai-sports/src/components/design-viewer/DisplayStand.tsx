import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STAGE_CONFIG } from "./config";

type Props = {
  accent: string;
  introRef: RefObject<number>;
  reducedMotion: boolean;
};

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export default function DisplayStand({ accent, introRef, reducedMotion }: Props) {
  const base = useRef<THREE.Mesh>(null);
  const stand = STAGE_CONFIG.stand;

  useFrame(() => {
    const disc = base.current;
    if (!disc) return;
    const progress = reducedMotion ? 1 : THREE.MathUtils.clamp(introRef.current, 0, 1);
    const scale = 0.6 + easeOutCubic(progress) * 0.4;
    disc.scale.set(scale, 1, scale);
  });

  return (
    <group>
      <mesh
        ref={base}
        castShadow
        receiveShadow
        position={[0, stand.baseY, 0]}
      >
        <cylinderGeometry args={[stand.baseRadius, stand.baseRadius, stand.baseHeight, 64]} />
        <meshStandardMaterial color="#191918" metalness={0.88} roughness={0.36} />
      </mesh>

      <mesh
        position={[0, stand.baseY + stand.baseHeight / 2 + 0.008, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[stand.baseRadius - 0.025, stand.rimTube, 10, 96]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.15}
          toneMapped={false}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, stand.baseY + stand.poleHeight / 2, stand.poleZ]}
      >
        <cylinderGeometry args={[stand.poleRadius, stand.poleRadius, stand.poleHeight, 20]} />
        <meshStandardMaterial color="#90908b" metalness={1} roughness={0.29} />
      </mesh>

      <mesh
        position={[0, stand.baseY + stand.poleHeight, stand.poleZ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <sphereGeometry args={[stand.poleRadius * 1.7, 16, 12]} />
        <meshStandardMaterial color="#b5b3ac" metalness={1} roughness={0.24} />
      </mesh>
    </group>
  );
}
