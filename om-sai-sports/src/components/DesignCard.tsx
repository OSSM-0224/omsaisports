import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./design-card.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type DesignCardDesign = {
  designId: string;
  title: string;
  madeFor: string;
  seasonYear: string;
  jerseyNumber: string;
  colors: [string, string] | string[];
  specs: string[];
  frontUrl?: string;
  backUrl?: string;
  compositeUrl?: string;
  isNew?: boolean;
};

type Props = {
  design: DesignCardDesign;
  onOpen: () => void;
  className?: string;
  eager?: boolean;
};

function normalizeAcronyms(value: string) {
  return value.replace(/\b([A-Z]{2,})\b/g, (_, acronym: string) => acronym.toLowerCase());
}

export default function DesignCard({ design, onOpen, className = "", eager = false }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLImageElement | HTMLDivElement | null>(null);
  const backRef = useRef<HTMLImageElement | HTMLDivElement | null>(null);
  const numberRef = useRef<HTMLSpanElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const floatRef = useRef<gsap.core.Tween | null>(null);
  const [fanOpen, setFanOpen] = useState(false);
  const fanOpenRef = useRef(false);

  const dc = design.colors[0] || "#6B0F1A";
  const dc2 = design.colors[1] || "#E8DCC0";
  const specs = design.specs.slice(0, 3);
  const swatches = design.colors.slice(0, 4);
  const frontAlt = `Front of jersey design ${design.designId}`;
  const backAlt = `Back of jersey design ${design.designId}`;
  const canFan = Boolean(design.backUrl || design.compositeUrl);
  const isComposite = Boolean(design.compositeUrl && !design.frontUrl && !design.backUrl);
  const frontRestX = isComposite ? -100 : -62;
  const frontHoverX = isComposite ? -104 : -70;
  const backRestX = isComposite ? 0 : -24;
  const backHoverX = isComposite ? 4 : -14;

  useGSAP(
    () => {
      const card = cardRef.current;
      const front = frontRef.current;
      const back = backRef.current;
      const number = numberRef.current;
      const arrow = arrowRef.current;
      const stage = stageRef.current;
      if (!card || !front || !arrow || !stage) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(card, { autoAlpha: 0, y: 32 });
        ScrollTrigger.create({
          trigger: card,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(card, {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
          },
        });
        if (gsap.getProperty(card, "autoAlpha") === 0) {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.88) {
            gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
          }
        }

        gsap.set(front, { xPercent: frontRestX, yPercent: -50, rotation: 0, scale: 1 });
        if (back) gsap.set(back, { xPercent: backRestX, yPercent: -48, rotation: isComposite ? 0 : 7, scale: isComposite ? 1 : 0.9, y: 0 });
        if (number) gsap.set(number, { x: 0 });
        gsap.set(arrow, { rotation: 0, backgroundColor: "transparent", borderColor: "rgba(244,239,230,0.25)", color: "#F4EFE6" });

        const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
        tl.to(front, { xPercent: frontHoverX + 2, duration: 0.06, ease: "power2.out" }, 0);
        tl.to(front, { xPercent: frontHoverX, rotation: isComposite ? -3 : -4, duration: 0.34, ease: "back.out(1.3)" }, 0.06);
        if (back) {
          tl.to(back, { xPercent: backHoverX, yPercent: -50, rotation: isComposite ? 5 : 11, y: isComposite ? -6 : -8, scale: isComposite ? 1 : 0.9, duration: 0.34, ease: "back.out(1.3)" }, 0.06);
        }
        if (number) tl.to(number, { x: -10, duration: 0.3, ease: "power3.out" }, 0.06);
        tl.to(arrow, { rotation: 45, backgroundColor: "#FF5A00", borderColor: "#FF5A00", color: "#0C0C0D", duration: 0.24, ease: "power2.out" }, 0.04);
        tlRef.current = tl;

        const float = gsap.to(stage, {
          y: -4,
          duration: 3.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          paused: true,
        });
        floatRef.current = float;

        ScrollTrigger.create({
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => float.play(),
          onEnterBack: () => float.play(),
          onLeave: () => float.pause(),
          onLeaveBack: () => float.pause(),
        });
        const rect = card.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) float.play();

        return () => {
          tl.kill();
          tlRef.current = null;
          float.kill();
          floatRef.current = null;
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(card, { clearProps: "all", autoAlpha: 1, y: 0 });
        gsap.set(front, { xPercent: frontRestX, yPercent: -50, rotation: 0, scale: 1 });
        if (back) gsap.set(back, { xPercent: backRestX, yPercent: -48, rotation: isComposite ? 0 : 7, scale: isComposite ? 1 : 0.9, y: 0 });
        if (number) gsap.set(number, { x: 0 });
        gsap.set(arrow, { rotation: 0, backgroundColor: "transparent", borderColor: "rgba(244,239,230,0.25)", color: "#F4EFE6" });
        tlRef.current = null;
        floatRef.current = null;
      });

      return () => mm.revert();
    },
    { scope: cardRef }
  );

  const playFan = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    tlRef.current?.play();
  };
  const reverseFan = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    tlRef.current?.reverse();
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    playFan();
  };
  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    fanOpenRef.current = false;
    setFanOpen(false);
    reverseFan();
  };
  const handleFocus = () => playFan();
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      fanOpenRef.current = false;
      setFanOpen(false);
      reverseFan();
    }
  };

  const handleClick = () => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch && canFan && !fanOpenRef.current) {
      fanOpenRef.current = true;
      setFanOpen(true);
      playFan();
      return;
    }
    fanOpenRef.current = false;
    setFanOpen(false);
    onOpen();
  };

  const handleView3D = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fanOpenRef.current = false;
    setFanOpen(false);
    onOpen();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const renderJersey = (side: "front" | "back") => {
    const isFront = side === "front";
    const ref = isFront ? frontRef : backRef;
    const alt = isFront ? frontAlt : backAlt;
    const cls = `dc-jersey ${isFront ? "dc-jersey-front" : "dc-jersey-back"}`;

    if (design.compositeUrl && !design.frontUrl && !design.backUrl) {
      return (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${cls} dc-jersey-composite`}
          role="img"
          aria-label={alt}
          style={{ backgroundImage: `url(${design.compositeUrl})` }}
        />
      );
    }

    const src = isFront ? design.frontUrl || design.compositeUrl : design.backUrl;
    if (!src) return null;

    return (
      <img
        ref={ref as React.RefObject<HTMLImageElement>}
        className={cls}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
      />
    );
  };

  const hasBack = Boolean(design.backUrl || design.compositeUrl);
  const hasFront = Boolean(design.frontUrl || design.compositeUrl);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      className={`dc-card ${fanOpen ? "is-fan-open" : ""} ${className}`.trim()}
      style={{ "--dc": dc, "--dc2": dc2 } as React.CSSProperties}
      aria-label={`${design.title}, made for ${design.madeFor}, open in 3D`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <span className="dc-base" aria-hidden="true" />
      <span className="dc-grain" aria-hidden="true" />
      <span ref={numberRef} className="dc-number" aria-hidden="true">
        {design.jerseyNumber}
      </span>

      <div ref={stageRef} className="dc-stage" aria-hidden="true">
        <div className="dc-jersey-wrap">
          {hasBack ? renderJersey("back") : null}
          {hasFront ? renderJersey("front") : null}
          {!hasFront && !hasBack ? null : <span className="dc-floor" />}
        </div>
      </div>

      <div className="dc-top">
        <div className="dc-top-left">
          <span className="dc-chip">Made for {design.madeFor}</span>
          {design.isNew ? <span className="dc-new">NEW</span> : null}
        </div>
        <span ref={arrowRef} className="dc-arrow" aria-hidden="true">
          <ArrowUpRight strokeWidth={1.8} />
        </span>
      </div>

      <div className="dc-hangtag" aria-hidden="true">
        <span className="dc-hangtag-string" />
        <span className="dc-hangtag-body">
          <span className="dc-hangtag-hole" />
          <span style={{ fontVariantCaps: "all-small-caps" }}>{normalizeAcronyms("OSS")}</span>
        </span>
      </div>

      <div className="dc-info">
        <div className="dc-meta">
          <span style={{ fontVariantCaps: "all-small-caps" }}>{normalizeAcronyms(design.designId)}</span> · {design.seasonYear}
        </div>
        <h3 className="dc-title">{design.title}</h3>
        <div className="dc-specs" aria-label="Specifications">
          {specs.map((spec) => (
            <span key={spec} className="dc-spec">
              {spec}
            </span>
          ))}
        </div>
        <div className="dc-bottom">
          <span className="dc-swatches" aria-label="Design colours">
            {swatches.map((color, i) => (
              <span key={`${color}-${i}`} className="dc-swatch" style={{ background: color }} />
            ))}
          </span>
          <button type="button" className="dc-view3d" onClick={handleView3D}>
            View in 3D
          </button>
        </div>
      </div>
    </div>
  );
}