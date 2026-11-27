import { useRef, type MutableRefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  getHotspotNote,
  jerseyHotspots,
  type HotspotConfig,
  type HotspotId,
  type ViewerDesign,
} from "./config";

gsap.registerPlugin(useGSAP);

export type HotspotElementMap = Map<HotspotId, HTMLElement>;

type Props = {
  design: ViewerDesign;
  active: HotspotId | null;
  reducedMotion: boolean;
  enabled: boolean;
  registry: MutableRefObject<HotspotElementMap>;
  onSelect: (id: HotspotId | null) => void;
};

function HotspotPoint({
  spot,
  design,
  isActive,
  reducedMotion,
  enabled,
  registry,
  onSelect,
}: Omit<Props, "active"> & { spot: HotspotConfig; isActive: boolean }) {
  const pointRef = useRef<HTMLDivElement | null>(null);
  const noteRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLSpanElement | null>(null);
  const note = getHotspotNote(design, spot.id);

  useGSAP(
    () => {
      const element = pointRef.current;
      if (!element) return;
      if (enabled) registry.current.set(spot.id, element);
      else registry.current.delete(spot.id);
      return () => {
        if (registry.current.get(spot.id) === element) registry.current.delete(spot.id);
      };
    },
    { scope: pointRef, dependencies: [enabled, registry, spot.id] },
  );

  useGSAP(
    () => {
      const target = noteRef.current;
      if (!target) return;
      if (!isActive) {
        gsap.set(target, { autoAlpha: 0, y: 8, scale: 0.94 });
        return;
      }
      if (reducedMotion) {
        gsap.set(target, { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }
      gsap.fromTo(
        target,
        { autoAlpha: 0, y: 8, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" },
      );
    },
    { scope: noteRef, dependencies: [isActive, reducedMotion] },
  );

  useGSAP(
    () => {
      const core = coreRef.current;
      if (!core || reducedMotion) {
        if (core) gsap.set(core, { scale: 1, opacity: 1 });
        return;
      }
      const tween = gsap.to(core, {
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
    <div
      ref={pointRef}
      className={`dsv-hotspot-point${isActive ? " is-active" : ""}`}
      data-spot={spot.id}
      style={{ visibility: "hidden", opacity: 0 }}
    >
      <button
        type="button"
        className="dsv-hotspot-dot"
        aria-label={`${spot.label} detail`}
        aria-pressed={isActive}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(isActive ? null : spot.id);
        }}
      >
        <span ref={coreRef} className="dsv-hotspot-core" />
      </button>
      <div ref={noteRef} className="dsv-hotspot-note" role="status" aria-hidden={!isActive}>
        <b>{spot.label}</b>
        <span>{note}</span>
      </div>
    </div>
  );
}

export default function HotspotOverlay({
  design,
  active,
  reducedMotion,
  enabled,
  registry,
  onSelect,
}: Props) {
  return (
    <div
      className="dsv-hotspot-overlay"
      aria-hidden={!enabled}
      style={{ visibility: enabled ? "visible" : "hidden" }}
    >
      {jerseyHotspots.map((spot) => (
        <HotspotPoint
          key={spot.id}
          spot={spot}
          design={design}
          isActive={active === spot.id}
          reducedMotion={reducedMotion}
          enabled={enabled}
          registry={registry}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
