import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { JerseyDesign } from "../lib/designs";
import { loadDesignTexture } from "../lib/designTextures";
import type { SpinState } from "../lib/spin";
import { DEFAULT_COLLAR_COLOR, getCollarColor } from "../lib/showcaseSettings";

// The Blender-authored template with the collar/placket already on its own
// material. Keep the original filename so it is easy to swap from assets/model.
const TEMPLATE_URL = "/models/3d%20mockup%20collar%20testing.glb";
const MODEL_HEIGHT = 3.3;

useGLTF.preload(TEMPLATE_URL);

type TemplateJerseyProps = {
  design: JerseyDesign;
  start: boolean;
  autoRotate: boolean;
  spinRef: RefObject<SpinState>;
  introRef: RefObject<number>;
  reducedMotion: boolean;
  baseX: number;
  baseY: number;
  onLoaded: () => void;
};

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function findMaterial(
  scene: THREE.Object3D,
  meshNames: string[],
  materialNames: string[],
): THREE.MeshStandardMaterial | null {
  const matches: THREE.Mesh[] = [];

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (meshNames.includes(object.name)) matches.push(object);
  });

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => materialNames.includes(material.name))) matches.push(object);
  });

  for (const mesh of matches) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const named = materials.find(
      (material) =>
        material instanceof THREE.MeshStandardMaterial && materialNames.includes(material.name),
    );
    const fallback = materials.find((material) => material instanceof THREE.MeshStandardMaterial);
    const picked = named ?? fallback;
    if (picked instanceof THREE.MeshStandardMaterial) return picked;
  }
  return null;
}

/**
 * One reusable GLB for every design. The cached scene is cloned, its materials
 * are cloned per mount, and the active design is applied by swapping the fabric
 * texture and the trim colour. No per-design model files and no Blender step.
 */
export default function TemplateJersey({
  design,
  start,
  autoRotate,
  spinRef,
  introRef,
  reducedMotion,
  baseX,
  baseY,
  onLoaded,
}: TemplateJerseyProps) {
  const group = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const announced = useRef(false);
  const fabricMaterial = useRef<THREE.MeshStandardMaterial | null>(null);
  const trimMaterial = useRef<THREE.MeshStandardMaterial | null>(null);
  const collarMaterial = useRef<THREE.MeshStandardMaterial | null>(null);
  const placeholder = useRef<{ map: THREE.Texture | null; color: THREE.Color } | null>(null);
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [ready, setReady] = useState(false);
  const [collarColor, setCollarColor] = useState(DEFAULT_COLLAR_COLOR);

  useEffect(() => {
    getCollarColor().then(setCollarColor);
  }, []);

  const { scene: sourceScene } = useGLTF(TEMPLATE_URL);
  const scene = useMemo(() => sourceScene.clone(true), [sourceScene]);

  const model = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { center, scale: MODEL_HEIGHT / Math.max(size.y, 0.0001) };
  }, [scene]);

  useEffect(() => {
    const owned: THREE.Material[] = [];

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material;
      const list = Array.isArray(original) ? original : [original];
      const clones = list.map((material) => {
        const clone = material.clone();
        owned.push(clone);
        return clone;
      });
      object.material = Array.isArray(original) ? clones : clones[0];
    });

    const fabric = findMaterial(scene, ["MainJersey"], ["Main Design", "JerseyFabric", "Front"]);
    fabricMaterial.current = fabric;
    placeholder.current = fabric
      ? { map: fabric.map, color: fabric.color.clone() }
      : null;
    trimMaterial.current = findMaterial(
      scene,
      ["EndSleeves"],
      ["Sleeve End Colour", "SleeveTrim"],
    );
    collarMaterial.current = findMaterial(
      scene,
      ["CollarTrim"],
      ["Collar Colour", "CollarTrim"],
    );

    return () => {
      for (const material of owned) material.dispose();
      fabricMaterial.current = null;
      trimMaterial.current = null;
      collarMaterial.current = null;
      placeholder.current = null;
    };
  }, [scene]);

  useEffect(() => {
    let active = true;
    setTexture(null);
    setReady(false);

    if (!design.image) {
      setReady(true);
      return () => {
        active = false;
      };
    }

    loadDesignTexture(design.image, Math.min(8, anisotropy))
      .then((next) => {
        if (!active) return;
        setTexture(next);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setTexture(null);
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [design.image, anisotropy]);

  useEffect(() => {
    const fabric = fabricMaterial.current;
    if (fabric) {
      // While a new texture loads, fall back to the template's own placeholder
      // instead of holding a texture that the cache may have disposed.
      fabric.map = texture ?? placeholder.current?.map ?? null;
      if (texture) fabric.color.set("#ffffff");
      else if (placeholder.current) fabric.color.copy(placeholder.current.color);
      fabric.needsUpdate = true;
    }

    // Sleeves follow the design accent; the collar/placket use the fixed
    // colour from public/designs/settings.json.
    const trim = trimMaterial.current;
    if (trim) {
      trim.color.set(design.accent || "#ff5a24");
      trim.needsUpdate = true;
    }

    const collar = collarMaterial.current;
    if (collar) {
      collar.color.set(collarColor);
      collar.needsUpdate = true;
    }
  }, [texture, design.accent, collarColor]);

  useEffect(() => {
    if (!ready || announced.current) return;
    announced.current = true;
    onLoaded();
  }, [ready, onLoaded]);

  useFrame((state, delta) => {
    const modelGroup = group.current;
    if (!modelGroup) return;

    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    const motion = reducedMotion ? 0 : 1;
    const current = spinRef.current;

    introRef.current = reducedMotion
      ? 1
      : THREE.MathUtils.damp(introRef.current, start ? 1 : 0, 1.8, dt);

    const eased = easeOutCubic(introRef.current);

    if (!current.dragging) {
      if (autoRotate) current.yaw += dt * 0.3 * motion;
      current.yaw += current.velocity * dt;
      current.velocity = THREE.MathUtils.damp(current.velocity, 0, 2.2, dt);
    }

    const bob = Math.sin(time * 1.15) * 0.12 * motion * eased;
    const idlePitch = Math.sin(time * 0.6 + 0.8) * 0.038 * motion * eased;
    const idleRoll = Math.sin(time * 0.8) * 0.085 * motion * eased;
    const idleYaw = Math.sin(time * 0.5) * 0.06 * motion * eased;

    modelGroup.position.set(baseX, baseY + (1 - eased) * -1.35 + bob, 0);
    modelGroup.rotation.y = THREE.MathUtils.damp(
      modelGroup.rotation.y,
      current.yaw + (1 - eased) * -0.9 + idleYaw,
      7,
      dt,
    );
    modelGroup.rotation.x = THREE.MathUtils.damp(
      modelGroup.rotation.x,
      current.pitch + (1 - eased) * 0.5 + (reducedMotion ? 0 : current.pointerY * 0.13 + idlePitch),
      5,
      dt,
    );
    modelGroup.rotation.z = THREE.MathUtils.damp(
      modelGroup.rotation.z,
      reducedMotion ? 0 : current.pointerX * 0.095 + idleRoll,
      5,
      dt,
    );

    const targetScale = 0.92 + eased * 0.08;
    modelGroup.scale.setScalar(THREE.MathUtils.damp(modelGroup.scale.x, targetScale, 6, dt));

    const pivotGroup = pivot.current;
    if (pivotGroup) {
      const targetX = THREE.MathUtils.clamp(current.pointerY * 0.09, -0.2, 0.2);
      const targetZ = THREE.MathUtils.clamp(
        -current.velocity * 0.032 - current.pointerX * 0.06,
        -0.3,
        0.3,
      );
      pivotGroup.rotation.x = THREE.MathUtils.damp(pivotGroup.rotation.x, targetX * motion * eased, 6, dt);
      pivotGroup.rotation.z = THREE.MathUtils.damp(pivotGroup.rotation.z, targetZ * motion * eased, 6, dt);
    }
  });

  return (
    <group ref={group} position={[baseX, baseY, 0]}>
      <group ref={pivot} position={[0, MODEL_HEIGHT / 2, 0]}>
        <group position={[0, -MODEL_HEIGHT / 2, 0]}>
          <group
            scale={model.scale}
            position={[
              -model.center.x * model.scale,
              -model.center.y * model.scale,
              -model.center.z * model.scale,
            ]}
          >
            <primitive object={scene} dispose={null} />
          </group>
        </group>
      </group>
    </group>
  );
}
