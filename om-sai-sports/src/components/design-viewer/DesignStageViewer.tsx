import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  MoveHorizontal,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { buildDesignInquiryMessage, buildWhatsAppUrl } from "../../lib/config";
import { preloadDesignTextures, pruneDesignTextures } from "../../lib/designTextures";
import { createSpinState } from "../../lib/spin";
import {
  CAMERA_PRESETS,
  STAGE_CONFIG,
  categoryLabel,
  getViewerPalette,
  jerseyHotspots,
  type CameraPreset,
  type HotspotId,
  type ViewerDesign,
} from "./config";
import FloorRing from "./FloorRing";
import HotspotOverlay, { type HotspotElementMap } from "./HotspotOverlay";
import { useReducedMotion, useViewerMotion } from "./motion";
import ThreeStage, { hasWebGL, type StageApi } from "./ThreeStage";
import "./viewer.css";

gsap.registerPlugin(useGSAP);

type ControlId = CameraPreset | "spin";

type Props = {
  design: ViewerDesign;
  designs: ViewerDesign[];
  index: number;
  opener: HTMLElement | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

function formatCount(value: number) {
  return String(value).padStart(2, "0");
}

function titleLines(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["Design"];
  const perLine = Math.max(1, Math.ceil(words.length / 3));
  const lines: string[] = [];
  for (let index = 0; index < words.length; index += perLine) {
    lines.push(words.slice(index, index + perLine).join(" "));
  }
  return lines.slice(0, 3);
}

function detectLowEnd() {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return (navigator.hardwareConcurrency ?? 8) <= 4 || memory <= 4;
}

type Control = {
  id: ControlId;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export default function DesignStageViewer({
  design,
  designs,
  index,
  opener,
  onSelect,
  onClose,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const stageVisualRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const slipRef = useRef<HTMLDivElement | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const dragHintRef = useRef<HTMLDivElement | null>(null);
  const stageApi = useRef<StageApi | null>(null);
  const hotspotRegistry = useRef<HotspotElementMap>(new Map());
  const spinRef = useRef(createSpinState(0.35));
  const introRef = useRef(0);
  const idleTimer = useRef<number | null>(null);
  const hotspotRef = useRef<HotspotId | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const reducedMotion = useReducedMotion();
  const canRender3D = useMemo(() => hasWebGL(), []);
  const [activeControl, setActiveControl] = useState<ControlId>("front");
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const [autoRotate, setAutoRotate] = useState(() => !reducedMotion && canRender3D);
  const [loaded, setLoaded] = useState(() => !canRender3D);
  const [dragHintVisible, setDragHintVisible] = useState(true);
  const [slipOpen, setSlipOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 1023px)").matches,
  );
  const [lowEnd] = useState(detectLowEnd);

  const palette = useMemo(() => getViewerPalette(design), [design]);
  const message = useMemo(
    () => buildDesignInquiryMessage(design.id.toUpperCase(), design.title),
    [design.id, design.title],
  );
  const whatsappHref = useMemo(() => buildWhatsAppUrl(message), [message]);
  const shareUrl = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}${window.location.pathname}?d=${encodeURIComponent(design.id)}`,
    [design.id],
  );

  const origin = useMemo(() => {
    if (!opener || typeof opener.getBoundingClientRect !== "function") {
      return { x: "50%", y: "50%" };
    }
    const rect = opener.getBoundingClientRect();
    return {
      x: `${Math.round(rect.left + rect.width / 2)}px`,
      y: `${Math.round(rect.top + rect.height / 2)}px`,
    };
  }, [opener]);

  const invalidate = useCallback(() => stageApi.current?.invalidate(), []);
  const { playClose, swap, toast: animateToast, slip: animateSlip, sheet: animateSheet } =
    useViewerMotion({
      rootRef,
      reducedMotion,
      invalidate,
      onClosed: onClose,
    });

  const clearIdle = useCallback(() => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const markInteraction = useCallback(() => {
    setDragHintVisible(false);
    if (reducedMotion || !canRender3D) return;
    setAutoRotate(false);
    clearIdle();
    idleTimer.current = window.setTimeout(() => {
      if (!hotspotRef.current) setAutoRotate(true);
    }, 4000);
  }, [canRender3D, clearIdle, reducedMotion]);

  const resetView = useCallback(() => {
    spinRef.current = createSpinState(0.35);
    introRef.current = reducedMotion ? 1 : 0;
    setActiveHotspot(null);
    hotspotRef.current = null;
    setActiveControl("front");
    setSlipOpen(false);
    clearIdle();
    setAutoRotate(!reducedMotion && canRender3D);
    stageApi.current?.reset();
  }, [canRender3D, clearIdle, reducedMotion]);

  const changeDesign = useCallback(
    (id: string) => {
      if (id === design.id) return;
      setActiveHotspot(null);
      hotspotRef.current = null;
      setSlipOpen(false);
      swap(() => onSelect(id));
    },
    [design.id, onSelect, swap],
  );

  const setCamera = useCallback(
    (preset: CameraPreset) => {
      if (!canRender3D) return;
      setActiveHotspot(null);
      hotspotRef.current = null;
      setActiveControl(preset);
      stageApi.current?.setView(preset);
    },
    [canRender3D],
  );

  const selectHotspot = useCallback(
    (id: HotspotId | null) => {
      if (!canRender3D) return;
      setActiveHotspot(id);
      hotspotRef.current = id;
      clearIdle();
      if (id) {
        const spot = jerseyHotspots.find((item) => item.id === id);
        setActiveControl(id);
        setAutoRotate(false);
        if (spot) stageApi.current?.setView(spot.cameraPreset);
      } else {
        setActiveControl("front");
        stageApi.current?.setView("home");
        if (!reducedMotion) setAutoRotate(true);
      }
    },
    [canRender3D, clearIdle, reducedMotion],
  );

  const handleSpin = useCallback(() => {
    if (!canRender3D) return;
    spinRef.current = createSpinState(0.35);
    introRef.current = reducedMotion ? 1 : 0;
    setActiveControl("spin");
    setActiveHotspot(null);
    hotspotRef.current = null;
    clearIdle();
    setAutoRotate(!reducedMotion);
    stageApi.current?.setView("home");
  }, [canRender3D, clearIdle, reducedMotion]);

  const showToast = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
  }, []);

  const copyText = useCallback(
    async (value: string, successText: string) => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(value);
        showToast(successText);
      } catch {
        showToast("Copy unavailable");
      }
    },
    [showToast],
  );

  const currentStrip = useMemo(() => {
    const categoryDesigns = designs.filter((item) => item.category === design.category);
    const source = categoryDesigns.length > 1 ? categoryDesigns : designs;
    const currentIndex = Math.max(
      0,
      source.findIndex((item) => item.id === design.id),
    );
    const size = Math.min(24, source.length);
    const start = Math.max(0, Math.min(currentIndex - 11, source.length - size));
    return source.slice(start, start + size);
  }, [design.category, design.id, designs]);

  const dustCount = reducedMotion || lowEnd ? 0 : isMobile ? STAGE_CONFIG.dust.mobileCount : STAGE_CONFIG.dust.desktopCount;

  const controls: Control[] = [
    { id: "front", label: "FRONT", shortcut: "F", icon: ImageIcon, disabled: !canRender3D },
    { id: "back", label: "BACK", shortcut: "B", icon: RotateCw, disabled: !canRender3D },
    { id: "side", label: "SIDE", shortcut: "S", icon: MoveHorizontal, disabled: !canRender3D },
    { id: "spin", label: "SPIN 360", icon: RotateCw, disabled: !canRender3D },
    { id: "detail", label: "ZOOM DETAIL", icon: ZoomIn, disabled: !canRender3D },
    { id: "home", label: "RESET VIEW", shortcut: "R", icon: RotateCcw, disabled: !canRender3D },
  ];

  const handleControl = useCallback(
    (id: ControlId) => {
      if (id === "spin") handleSpin();
      else if (id === "home") resetView();
      else setCamera(id);
    },
    [handleSpin, resetView, setCamera],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const currentIndex = designs.findIndex((item) => item.id === design.id);
    const neighbours = [
      designs[currentIndex - 1]?.image,
      designs[currentIndex + 1]?.image,
    ].filter((url): url is string => Boolean(url));
    preloadDesignTextures(neighbours);
    const timer = window.setTimeout(() => {
      pruneDesignTextures([design.image, ...neighbours].filter((url): url is string => Boolean(url)));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [design.id, design.image, designs]);

  useEffect(() => () => pruneDesignTextures([]), []);

  useEffect(() => {
    if (!canRender3D) setLoaded(true);
  }, [canRender3D]);

  useEffect(() => {
    animateSlip(slipRef.current, slipOpen);
  }, [animateSlip, slipOpen]);

  useEffect(() => {
    animateSheet(sheetRef.current, sheetExpanded);
  }, [animateSheet, sheetExpanded]);

  useEffect(() => {
    if (toast) animateToast(toastRef.current);
  }, [animateToast, toast]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const previousOverflow = document.body.style.overflow;
    const hadOpenClass = document.body.classList.contains("dsv-open");
    document.body.style.overflow = "hidden";
    document.body.classList.add("dsv-open");
    closeRef.current?.focus({ preventScroll: true });

    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onTab);
    return () => {
      window.removeEventListener("keydown", onTab);
      document.body.style.overflow = previousOverflow;
      if (!hadOpenClass) document.body.classList.remove("dsv-open");
      clearIdle();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [clearIdle, opener]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        event.preventDefault();
        if (slipOpen) setSlipOpen(false);
        else if (activeHotspot) selectHotspot(null);
        else if (sheetExpanded) setSheetExpanded(false);
        else playClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeDesign(designs[(index - 1 + designs.length) % designs.length].id);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        changeDesign(designs[(index + 1) % designs.length].id);
        return;
      }
      if (key === "f") setCamera("front");
      else if (key === "b") setCamera("back");
      else if (key === "s") setCamera("side");
      else if (key === "r") resetView();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeHotspot, changeDesign, designs, index, playClose, resetView, selectHotspot, setCamera, sheetExpanded, slipOpen]);

  useGSAP(
    () => {
      if (!dragHintRef.current) return;
      gsap.to(dragHintRef.current, {
        autoAlpha: dragHintVisible && canRender3D ? 1 : 0,
        duration: reducedMotion ? 0 : 0.25,
        ease: "power2.out",
      });
    },
    { scope: rootRef, dependencies: [canRender3D, dragHintVisible, reducedMotion] },
  );

  const styleVars = {
    "--dsv-dc": palette.dc,
    "--dsv-dc2": palette.dc2,
    "--dsv-glow": palette.glow,
    "--dsv-edge": palette.edge,
    "--dsv-dc-rgb": palette.rgb.dc,
    "--dsv-dc2-rgb": palette.rgb.dc2,
    "--dsv-glow-rgb": palette.rgb.glow,
    "--dsv-edge-rgb": palette.rgb.edge,
    "--dsv-origin-x": origin.x,
    "--dsv-origin-y": origin.y,
  } as CSSProperties;

  const words = design.title.trim().split(/\s+/).filter(Boolean);
  const firstRow = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const secondRow = words.slice(Math.ceil(words.length / 2)).join(" ") || design.title;
  const madeFor = design.madeFor || design.tag || "Custom";
  const specs = (design.specs || []).slice(0, 4);
  const colors = (design.colors?.length ? design.colors : [palette.dc, palette.dc2]).slice(0, 4);
  const flatImage = design.image || design.thumb;

  const onHandleClick = () => {
    setSheetExpanded((value) => !value);
  };

  const flatStage = (
    <div className="dsv-flat-stage">
      <img src={flatImage} alt={`Flat view of ${design.title}`} draggable={false} />
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="dsv"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dsv-title"
      style={styleVars}
    >
      <div className="dsv-background" aria-hidden="true">
        <div className="dsv-spotlight" />
        <div className="dsv-edge-tint" />
        <div className="dsv-vignette" />
        <div className="dsv-grain" />
      </div>

      <div className="dsv-back-type" aria-hidden="true">
        <div className="dsv-back-row dsv-back-row-a">{firstRow}</div>
        {design.jerseyNumber ? (
          <div className="dsv-back-number">{design.jerseyNumber}</div>
        ) : (
          <div className="dsv-back-row dsv-back-row-b">{secondRow}</div>
        )}
      </div>

      <header className="dsv-top-bar">
        <div className="dsv-top-left">
          <span>DRAG TO ROTATE</span>
          <span className="dsv-counter">
            {formatCount(index + 1)} / {formatCount(designs.length)}
          </span>
        </div>
        <div className="dsv-top-actions">
          <button type="button" className="dsv-icon-button" onClick={resetView} aria-label="Reset view">
            <RotateCcw size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            ref={closeRef}
            type="button"
            className="dsv-icon-button dsv-close"
            onClick={playClose}
            aria-label="Close design viewer"
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="dsv-layout">
        <section
          className="dsv-stage-wrap"
          aria-label={`3D stage for ${design.title}`}
          onPointerDown={markInteraction}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const touch = event.changedTouches[0];
            touchStart.current = null;
            if (!start || !touch) return;
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
            changeDesign(designs[(index + (dx < 0 ? 1 : -1) + designs.length) % designs.length].id);
          }}
        >
          <div ref={stageVisualRef} className="dsv-stage-visual">
            <FloorRing madeFor={madeFor} />
            <div className="dsv-stage-layer dsv-canvas-layer">
              {canRender3D ? (
                <ThreeStage
                  design={design}
                  reducedMotion={reducedMotion}
                  autoRotate={autoRotate}
                  dustCount={dustCount}
                  glow={palette.glow}
                  accent={palette.dc}
                  hotspotRegistry={hotspotRegistry}
                  introRef={introRef}
                  spinRef={spinRef}
                  apiRef={stageApi}
                  onInteracted={markInteraction}
                  onLoaded={() => setLoaded(true)}
                  fallback={flatStage}
                />
              ) : (
                flatStage
              )}
            </div>
            {!loaded ? <div className="dsv-loader">PREPARING STAGE</div> : null}

            <HotspotOverlay
              design={design}
              active={activeHotspot}
              reducedMotion={reducedMotion}
              enabled={canRender3D}
              registry={hotspotRegistry}
              onSelect={selectHotspot}
            />

            <button
              type="button"
              className="dsv-edge-arrow dsv-edge-arrow-prev"
              onClick={() => changeDesign(designs[(index - 1 + designs.length) % designs.length].id)}
              aria-label="Previous design"
            >
              <ChevronLeft size={22} strokeWidth={1.7} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="dsv-edge-arrow dsv-edge-arrow-next"
              onClick={() => changeDesign(designs[(index + 1) % designs.length].id)}
              aria-label="Next design"
            >
              <ChevronRight size={22} strokeWidth={1.7} aria-hidden="true" />
            </button>

            <div ref={dragHintRef} className="dsv-drag-hint">
              <MoveHorizontal size={17} strokeWidth={1.7} className="dsv-drag-icon" aria-hidden="true" />
              <span>Drag to rotate</span>
            </div>
          </div>
        </section>

        <div ref={sheetRef} className="dsv-sheet">
          <button
            type="button"
            className="dsv-sheet-handle"
            onClick={onHandleClick}
            aria-label={sheetExpanded ? "Collapse details" : "Expand details"}
            aria-expanded={sheetExpanded}
          >
            <span />
          </button>

          <aside className="dsv-info" aria-label="Design information">
            <p className="dsv-eyebrow dsv-reveal-line">
              {categoryLabel(design.category)} collection · {design.seasonYear || "2026"}
            </p>
            <h2 id="dsv-title" className="dsv-title">
              {titleLines(design.title).map((line) => (
                <span className="dsv-title-line" key={line}>
                  <span className="dsv-reveal-line">{line}</span>
                </span>
              ))}
            </h2>

            <div className="dsv-made-chip dsv-reveal-line">
              <svg viewBox="0 0 24 28" aria-hidden="true" focusable="false">
                <path d="M12 1 22 5v10c0 6-4.6 10-10 12C6.6 25 2 21 2 15V5L12 1Z" />
                <path d="M12 6v15M7 11h10" />
              </svg>
              <span>Made for {madeFor}</span>
            </div>

            {(design as ViewerDesign & { tagline?: string }).tagline ? (
              <p className="dsv-tagline dsv-reveal-line">
                “{(design as ViewerDesign & { tagline?: string }).tagline}”
              </p>
            ) : null}

            {specs.length ? (
              <div className="dsv-specs dsv-reveal-line">
                {specs.map((spec) => (
                  <span key={spec}>{spec}</span>
                ))}
              </div>
            ) : null}

            <div className="dsv-palette dsv-reveal-line">
              {colors.map((color) => (
                <button
                  type="button"
                  className="dsv-swatch"
                  key={color}
                  onClick={() => copyText(color, "Copied")}
                  aria-label={`Copy colour ${color}`}
                >
                  <span className="dsv-swatch-dot" style={{ backgroundColor: color }} />
                  <span>{color}</span>
                </button>
              ))}
            </div>

            <div className="dsv-design-id dsv-reveal-line">{design.id.toUpperCase()}</div>
          </aside>

          <aside className="dsv-controls" aria-label="Stage controls">
            <div className="dsv-control-list">
              {controls.map(({ id, label, shortcut, icon: Icon, disabled }) => (
                <button
                  type="button"
                  className={`dsv-control${activeControl === id ? " is-active" : ""}`}
                  key={id}
                  onClick={() => handleControl(id)}
                  disabled={disabled}
                  aria-pressed={activeControl === id}
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                  {shortcut ? <kbd>{shortcut}</kbd> : null}
                </button>
              ))}
            </div>

            <div className="dsv-look-closer">
              <h3>Look closer</h3>
              {jerseyHotspots.map((spot) => (
                <button
                  type="button"
                  key={spot.id}
                  onClick={() => selectHotspot(spot.id)}
                  disabled={!canRender3D}
                  aria-pressed={activeHotspot === spot.id}
                >
                  <span>{spot.label}</span>
                  <span className="dsv-look-line" />
                </button>
              ))}
            </div>

            <div className="dsv-shortcuts">
              <span>
                <kbd>F</kbd>
                <kbd>B</kbd>
                <kbd>S</kbd>
                <kbd>R</kbd>
              </span>
              <span>Esc to close</span>
            </div>
          </aside>

          <footer className="dsv-bottom-bar">
            <div className="dsv-filmstrip" aria-label="Designs in this collection">
              {currentStrip.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`dsv-film-thumb${item.id === design.id ? " is-current" : ""}`}
                  style={{
                    backgroundImage: `url("${item.thumb}")`,
                  }}
                  onClick={() => changeDesign(item.id)}
                  aria-label={`View ${item.title}`}
                  aria-current={item.id === design.id ? "true" : undefined}
                />
              ))}
            </div>

            <div className="dsv-actions">
              <button
                type="button"
                className="dsv-like-button"
                onClick={() => setSlipOpen((value) => !value)}
                aria-expanded={slipOpen}
              >
                <Heart size={17} strokeWidth={1.9} aria-hidden="true" />
                I like this design
              </button>
              <button
                type="button"
                className="dsv-copy-button"
                onClick={() => copyText(shareUrl, "Link copied")}
              >
                <Copy size={15} strokeWidth={1.8} aria-hidden="true" />
                Copy link
              </button>
            </div>
          </footer>
        </div>
      </div>

      <div ref={slipRef} className="dsv-slip" aria-hidden={!slipOpen}>
        <div className="dsv-slip-head">
          <span>Your note is ready</span>
          <button type="button" onClick={() => setSlipOpen(false)} aria-label="Close note">
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <p>{message}</p>
        <div className="dsv-slip-actions">
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            Continue on WhatsApp
            <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div ref={toastRef} className="dsv-toast" role="status" aria-live="polite">
        {toast?.text || ""}
      </div>
    </div>
  );
}
