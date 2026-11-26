import { Suspense, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { X, RotateCcw } from "lucide-react";
import * as THREE from "three";
import TemplateJersey from "./TemplateJersey";
import { createSpinState, clamp } from "../lib/spin";
import type { JerseyDesign } from "../lib/designs";

type Props = {
  item: {
    id: string;
    title: string;
    category: string;
    tag: string;
    image: string;
    designImage?: string;
    accent?: string;
  };
  onClose: () => void;
};

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} color="#fff4ea" />
      <directionalLight position={[-5, 3, -4]} intensity={1.2} color="#ffd6c2" />
      <Environment preset="city" />
    </>
  );
}

export default function Design3DModal({ item, onClose }: Props) {
  const spin = useRef(createSpinState(0.35));
  const intro = useRef(0);
  const last = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [ready, setReady] = useState(false);

  const categoryMap: Record<string, JerseyDesign["category"]> = {
    sports: "sports",
    ganpati: "festival",
    devi: "festival",
    commercial: "commercial",
  };

  const design: JerseyDesign = {
    id: item.id,
    title: item.title,
    category: categoryMap[item.category] || "sports",
    image: item.designImage || item.image,
    thumb: item.image,
    accent: item.accent || "#ff5a24",
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(true);
    setAutoRotate(false);
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    if (dragging) {
      spin.current.yaw += dx * 0.008;
      spin.current.pitch = clamp(spin.current.pitch + dy * 0.005, -0.45, 0.45);
      spin.current.velocity = dx * 0.002;
    }
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    spin.current.pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    spin.current.pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="ds-preview" role="dialog" aria-modal="true" aria-label={`${item.title} 3D preview`} onClick={onClose}>
      <div className="ds-preview-dialog ds-preview-dialog-3d" onClick={(e) => e.stopPropagation()}>
        <div className="ds-preview-head">
          <div className="ds-preview-meta">
            <p>{item.category} / {item.tag}</p>
            <h3>{item.title}</h3>
          </div>
          <div className="ds-preview-head-actions">
            <button type="button" className="ds-preview-icon-btn" onClick={() => { spin.current = createSpinState(0.35); intro.current = 0; setAutoRotate(true); }} aria-label="Reset view">
              <RotateCcw size={16} strokeWidth={1.8} />
            </button>
            <button type="button" className="ds-preview-icon-btn" onClick={onClose} aria-label="Close preview">
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div
          className={`ds-preview-canvas${dragging ? " is-dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setDragging(false)}
        >
          {!ready && <div className="ds-preview-loading">Loading 3D view…</div>}
          <Canvas
            camera={{ position: [0, 0.15, 7.5], fov: 34 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.08;
            }}
          >
            <Suspense fallback={null}>
              <StudioLights />
              <TemplateJersey
                design={design}
                start={true}
                autoRotate={autoRotate}
                spinRef={spin}
                introRef={intro}
                reducedMotion={false}
                baseX={0}
                baseY={-0.15}
                onLoaded={() => setReady(true)}
              />
            </Suspense>
          </Canvas>
        </div>
        <div className="ds-preview-foot">
          <span>Drag to rotate</span>
          <span>{item.accent?.toUpperCase() || "CUSTOM"}</span>
        </div>
      </div>
    </div>
  );
}
