import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as THREE from "three";
import {
  getHotspotNote,
  jerseyHotspots,
  type HotspotConfig,
  type HotspotId,
  type ViewerDesign,
} from "./config";

gsap.registerPlugin(useGSAP);

type Props = {
  design: ViewerDesign;
  groupRef: RefObject<THREE.Group | null>;
  active: HotspotId | null;
  reducedMotion: boolean;
  onSelect: (id: HotspotId | null) => void;
};

function Hotspot({
  spot,
  design,
  groupRef,
  active,
  reducedMotion,
  onSelect,
}: Props & { spot: HotspotConfig }) {
  const noteRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLSpanElement | null>(null);
  const facingRef = useRef(true);
  const [facing, setFacing] = useState(true);
  const vectors = useMemo(
    () => ({
      anchor: new THREE.Vector3(...spot.position),
      normal: new THREE.Vector3(...spot.normal),
      worldAnchor: new THREE.Vector3(),
      worldNormal: new THREE.Vector3(),
      toCamera: new THREE.Vector3(),
    }),
    [spot],
  );
  const isActive = active === spot.id;
  const note = getHotspotNote(design, spot.id);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (group) {
      vectors.worldAnchor.copy(vectors.anchor).applyMatrix4(group.matrixWorld);
      vectors.worldNormal.copy(vectors.normal).transformDirection(group.matrixWorld);
    } else {
      vectors.worldAnchor.copy(vectors.anchor);
      vectors.worldNormal.copy(vectors.normal);
    }
    vectors.toCamera.copy(camera.position).sub(vectors.worldAnchor).normalize();
    const next = vectors.toCamera.dot(vectors.worldNormal) > 0.04;
    if (next !== facingRef.current) {
      facingRef.current = next;
      setFacing(next);
    }
  });

  useGSAP(
    () => {
      const note = noteRef.current;
      if (!note) return;
      if (!isActive) {
        gsap.set(note, { autoAlpha: 0, y: 8, scale: 0.94 });
        return;
      }
      if (reducedMotion) {
        gsap.set(note, { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }
      gsap.fromTo(
        note,
        { autoAlpha: 0, y: 8, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" },
      );
    },
    { scope: noteRef, dependencies: [isActive, reducedMotion] },
  );

  useGSAP(
    () => {
      if (!coreRef.current || reducedMotion) {
        if (coreRef.current) gsap.set(coreRef.current, { scale: 1, opacity: 1 });
        return;
      }
      const tween = gsap.to(coreRef.current, {
        scale: 1.9,
        opacity: 0.35,
        duration: 1.15,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      return () => tween.kill();
    },
    { scope: coreRef, dependencies: [reducedMotion] },
  );

  return (
    <Html
      position={spot.position}
      center
      distanceFactor={7.2}
      zIndexRange={[60, 20]}
      style={{
        pointerEvents: facing ? "auto" : "none",
        opacity: facing ? 1 : 0,
        visibility: facing ? "visible" : "hidden",
      }}
    >
      <div className="dsv-hotspot-wrap">
        <button
          type="button"
          className={`dsv-hotspot-dot${isActive ? " is-active" : ""}`}
          aria-label={`${spot.label} detail`}
          aria-pressed={isActive}
          aria-hidden={!facing}
          tabIndex={facing ? 0 : -1}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(isActive ? null : spot.id);
          }}
        >
          <span ref={coreRef} className="dsv-hotspot-core" />
        </button>
        <div
          ref={noteRef}
          className="dsv-hotspot-note"
          role="status"
          aria-hidden={!isActive}
        >
          <b>{spot.label}</b>
          <span>{note}</span>
        </div>
      </div>
    </Html>
  );
}

export default function Hotspots({ design, groupRef, active, reducedMotion, onSelect }: Props) {
  return (
    <>
      {jerseyHotspots.map((spot) => (
        <Hotspot
          key={spot.id}
          spot={spot}
          design={design}
          groupRef={groupRef}
          active={active}
          reducedMotion={reducedMotion}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
