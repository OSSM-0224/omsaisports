import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import * as THREE from "three";
import TemplateJersey from "./TemplateJersey";
import { getDesigns, type DesignCategory, type JerseyDesign } from "../lib/designs";
import { DEFAULT_COLLAR_COLOR, getCollarColor } from "../lib/showcaseSettings";
import { preloadDesignTextures, pruneDesignTextures } from "../lib/designTextures";
import { clamp, createSpinState } from "../lib/spin";
import "../design-showcase.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FILTERS: Array<"all" | DesignCategory> = ["all", "sports", "festival", "commercial"];

const CATEGORY_META: Array<{
  key: DesignCategory;
  label: string;
  code: string;
  copy: string;
  accent: string;
}> = [
  {
    key: "sports",
    label: "Sports",
    code: "SP",
    copy: "Player editions, school crests and club kits built around your colours and your game.",
    accent: "#ff5a00",
  },
  {
    key: "festival",
    label: "Festival",
    code: "FE",
    copy: "Celebration editions with devotional and cultural artwork on the same single GLB.",
    accent: "#ff9f1c",
  },
  {
    key: "commercial",
    label: "Commercial",
    code: "CO",
    copy: "Sponsor-led and brand-led kits. This rail is ready for the next commercial drop.",
    accent: "#a9c7ff",
  },
];

const STUDIO_NOTES = [
  {
    id: "note-1",
    key: "sports",
    title: "One mesh, every print.",
    copy: "The GLB stays mounted. Selecting a kit swaps only the fabric texture — no reload, no second model.",
  },
  {
    id: "note-2",
    key: "festival",
    title: "Sleeve reads the manifest.",
    copy: "Each design carries its own accent. That single hex drives the sleeve trim and the archive marker.",
  },
  {
    id: "note-3",
    key: "commercial",
    title: "Collar stays locked.",
    copy: "One code in settings.json governs collar and placket on every kit in the archive.",
  },
] as const;

const MANIFESTO = "The print changes. The hands behind it do not.";

function SpinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.2 8A5.2 5.2 0 1 1 8 2.8c1.7 0 3.2.8 4.2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12.6 2.2v3.2H9.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StudioLights() {
  return (
    <>
      <hemisphereLight intensity={0.55} color="#d8d2c6" groundColor="#050505" />
      <directionalLight position={[3.5, 4.5, 5]} intensity={3.1} color="#fff2e2" />
      <directionalLight position={[-4.5, 1.5, -3]} intensity={3.4} color="#ff5a24" />
      <directionalLight position={[4, 2, -4]} intensity={1.9} color="#c7d6ff" />
      <pointLight position={[0, 0.4, 3.2]} intensity={9} distance={9} color="#ffe9d2" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.8} position={[0, 5, -6]} scale={[12, 8, 1]} color="#fff6e8" />
        <Lightformer form="rect" intensity={3.4} position={[-5, 1, 3]} scale={[3, 7, 1]} color="#ff6a2e" />
        <Lightformer form="rect" intensity={1.5} position={[5, 1, 2]} scale={[3, 6, 1]} color="#c7d8ff" />
        <Lightformer form="rect" intensity={0.8} position={[0, -4, 2]} scale={[9, 2, 1]} color="#f0ede6" />
      </Environment>
    </>
  );
}

export default function DesignShowcase() {
  const [designs, setDesigns] = useState<JerseyDesign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | DesignCategory>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [collarColor, setCollarColor] = useState(DEFAULT_COLLAR_COLOR);
  const [activeNote, setActiveNote] = useState(0);

  const siteRef = useRef<HTMLDivElement>(null);
  const spin = useRef(createSpinState(0.35));
  const intro = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const archivePinRef = useRef<HTMLDivElement>(null);
  const archiveScrollRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    getDesigns()
      .then((list) => {
        if (!active) return;
        setDesigns(list);
        const requested = new URLSearchParams(window.location.search).get("design");
        setSelectedId(list.find((item) => item.id === requested)?.id ?? list[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setError("Design manifest load nahi hua. Check /designs/manifest.json.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCollarColor().then((value) => {
      if (active) setCollarColor(value);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(query.matches);
      if (query.matches) setAutoRotate(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.title = "3D Jersey Studio — OM SAI SPORTS";
  }, []);

  const filtered = category === "all" ? designs : designs.filter((item) => item.category === category);
  const sections = CATEGORY_META.map((meta) => ({
    ...meta,
    items: filtered.filter((item) => item.category === meta.key),
  }));

  const selected = designs.find((item) => item.id === selectedId) ?? designs[0] ?? null;
  const selectedIndex = selected ? designs.findIndex((item) => item.id === selected.id) : -1;

  useEffect(() => {
    if (!selected || selectedIndex < 0) return;
    const urls = [
      selected.image,
      designs[selectedIndex - 1]?.image,
      designs[selectedIndex + 1]?.image,
    ].filter((url): url is string => Boolean(url));

    preloadDesignTextures(urls);
    pruneDesignTextures(urls);
  }, [selected, selectedIndex, designs]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1100px)", () => {
        const pin = archivePinRef.current;
        const rail = archiveScrollRef.current;
        if (!pin || !rail) return;
        gsap.set(pin, { y: 0 });
        ScrollTrigger.create({
          trigger: rail,
          start: "top 120px",
          end: "bottom bottom",
          pin,
          pinSpacing: false,
          pinType: "fixed",
          invalidateOnRefresh: true,
          onUpdate: () => gsap.set(pin, { y: 0 }),
        });
      });

      gsap.fromTo(
        ".ds-manifesto-word",
        { opacity: 0.14, yPercent: 14 },
        {
          opacity: 1,
          yPercent: 0,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: ".ds-manifesto",
            start: "top 84%",
            end: "bottom 52%",
            scrub: 0.5,
          },
        },
      );

      gsap.fromTo(
        ".ds-note-card",
        { "--card-shift": 120 },
        {
          "--card-shift": 0,
          stagger: 0.14,
          ease: "none",
          scrollTrigger: {
            trigger: ".ds-notes",
            start: "top 82%",
            end: "bottom 62%",
            scrub: 0.6,
          },
        },
      );

      return () => mm.revert();
    },
    { scope: siteRef, dependencies: [reducedMotion, designs.length] },
  );

  const handleLoaded = useCallback(() => setLoaded(true), []);

  const selectDesign = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const stepDesign = useCallback(
    (direction: number) => {
      if (!selected || designs.length === 0) return;
      const next = (selectedIndex + direction + designs.length) % designs.length;
      selectDesign(designs[next].id);
    },
    [designs, selected, selectedIndex, selectDesign],
  );

  const resetView = useCallback(() => {
    spin.current.yaw = 0.35;
    spin.current.pitch = 0;
    spin.current.velocity = 0;
    setAutoRotate(!reducedMotion);
  }, [reducedMotion]);

  const scrollToArchive = useCallback(() => {
    document.getElementById("ds-archive")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [reducedMotion]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    spin.current.dragging = true;
    spin.current.velocity = 0;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    spin.current.pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    spin.current.pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (!spin.current.dragging) return;

    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    spin.current.yaw += dx * 0.0072;
    spin.current.pitch = clamp(spin.current.pitch + dy * 0.0035, -0.28, 0.28);
    spin.current.velocity = dx * 0.28;
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!spin.current.dragging) return;
    spin.current.dragging = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerLeave = () => {
    if (spin.current.dragging) return;
    spin.current.pointerX = 0;
    spin.current.pointerY = 0;
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = 0.16;
    const directions: Record<string, "left" | "right" | "up" | "down"> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    if (direction === "left") spin.current.yaw -= step;
    if (direction === "right") spin.current.yaw += step;
    if (direction === "up") spin.current.pitch = clamp(spin.current.pitch - step * 0.5, -0.28, 0.28);
    if (direction === "down") spin.current.pitch = clamp(spin.current.pitch + step * 0.5, -0.28, 0.28);
  };

  const note = STUDIO_NOTES[activeNote];
  const noteThumb = designs.find((item) => item.category === note.key)?.thumb;

  return (
    <div className="ds-site" ref={siteRef}>
      <header className="site-head ds-head">
        <div className="glass-pill">
          <a className="brand-lockup" href="/" aria-label="OM SAI SPORTS — back to home">
            <img
              className="brand-mark"
              src="/brand/oss-shield-sm.png"
              width="96"
              height="120"
              alt=""
              aria-hidden="true"
              draggable="false"
            />
            <span className="brand-words">
              <span className="brand-name">OM SAI <em>SPORTS.</em></span>
              <span className="brand-sub">3D jersey studio / live texture swap</span>
            </span>
          </a>

          <nav className="pill-nav" aria-label="Showcase navigation">
            <a className="pill-link" data-text="Studio" href="#ds-studio"><span>Studio</span></a>
            <a className="pill-link" data-text="Categories" href="#ds-categories"><span>Categories</span></a>
            <a className="pill-link" data-text="Archive" href="#ds-archive"><span>Archive</span></a>
            <a className="pill-link" data-text="Home" href="/"><span>Home</span></a>
          </nav>

          <a className="pill-menu" href="/#contact" aria-label="Contact OM SAI SPORTS">
            <span>Enquire</span>
            <span className="pill-menu-dots" aria-hidden="true"><i /><i /><i /><i /></span>
          </a>
        </div>
      </header>

      <main className="ds-main">
        <section className="ds-hero" id="ds-studio">
          <div className="ds-hero-copy">
            <h1>
              One jersey.
              <span className="ds-hero-inline" aria-hidden="true">
                {selected && <img src={selected.thumb} alt="" draggable="false" />}
              </span>
              <span className="ds-hero-line"><em>Every story.</em></span>
            </h1>
            <p className="ds-lede">
              A single Blender-built GLB carries every print. Pick a kit from the archive and watch the
              fabric swap live — sleeves follow that design&apos;s accent, collar stays locked to your code.
            </p>
            <div className="ds-hero-actions">
              <button
                type="button"
                className="button button-orange"
                onClick={() => setAutoRotate((value) => !value)}
                aria-pressed={autoRotate}
                disabled={reducedMotion}
              >
                <SpinIcon />
                {reducedMotion ? "MOTION REDUCED" : autoRotate ? "AUTO SPIN ON" : "AUTO SPIN OFF"}
              </button>
              <button type="button" className="button button-outline" onClick={resetView}>
                <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
                RESET VIEW
              </button>
              <button type="button" className="ds-text-link" onClick={scrollToArchive}>
                BROWSE ARCHIVE <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="ds-console">
            <div className="ds-console-stage">
              <div
                ref={stageRef}
                className={`ds-stage ${dragging ? "is-dragging" : ""}`}
                role="group"
                tabIndex={0}
                aria-label="Interactive 3D jersey. Drag or use arrow keys to rotate."
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onPointerLeave={handlePointerLeave}
                onDoubleClick={resetView}
                onKeyDown={handleKeyDown}
              >
                <div className="ds-stage-chrome" aria-hidden="true">
                  <span>LIVE / GLB</span>
                  <span>{selected ? selected.id.toUpperCase() : "STANDBY"}</span>
                </div>
                <Canvas
                  dpr={[1, 1.8]}
                  camera={{ fov: 30, position: [0, 0.1, 9], near: 0.1, far: 100 }}
                  gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
                  onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.08;
                  }}
                >
                  <Suspense fallback={null}>
                    <StudioLights />
                    {selected && (
                      <TemplateJersey
                        design={selected}
                        start={loaded}
                        autoRotate={autoRotate}
                        spinRef={spin}
                        introRef={intro}
                        reducedMotion={reducedMotion}
                        baseX={0}
                        baseY={0}
                        onLoaded={handleLoaded}
                      />
                    )}
                  </Suspense>
                </Canvas>
                {!loaded && <div className="ds-stage-status" role="status">LOADING 3D JERSEY</div>}
                <p className="ds-hint">DRAG TO ROTATE / ARROW KEYS</p>
                <span className="ds-cross ds-cross-tl" aria-hidden="true" />
                <span className="ds-cross ds-cross-tr" aria-hidden="true" />
                <span className="ds-cross ds-cross-bl" aria-hidden="true" />
                <span className="ds-cross ds-cross-br" aria-hidden="true" />
              </div>
              <div className="ds-filmstrip" aria-label="Load a design into the studio">
                {designs.map((design) => (
                  <button
                    type="button"
                    key={design.id}
                    className={`ds-frame ${selected?.id === design.id ? "is-active" : ""}`}
                    onClick={() => selectDesign(design.id)}
                    aria-pressed={selected?.id === design.id}
                    aria-label={`View ${design.title}`}
                  >
                    <img src={design.thumb} alt="" loading="lazy" draggable="false" />
                    <span style={{ background: design.accent }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <aside className="ds-rail" aria-label="Studio readouts">
              <div className="ds-rail-cell ds-rail-now">
                <span className="ds-rail-key">NOW VIEWING</span>
                {selected ? (
                  <>
                    <strong>{selected.title}</strong>
                    <span className="ds-rail-id">{selected.category} / {selected.id}</span>
                    <span className="ds-rail-count">
                      {String(selectedIndex + 1).padStart(2, "0")}
                      <i>/</i>
                      {String(designs.length).padStart(2, "0")}
                    </span>
                  </>
                ) : (
                  <span className="ds-empty">{error ?? "Designs load ho rahe hain…"}</span>
                )}
              </div>

              <div className="ds-rail-cell">
                <span className="ds-rail-key">SLEEVE / ACCENT</span>
                <code>{selected?.accent ?? "—"}</code>
                <i className="ds-rail-swatch" style={{ background: selected?.accent ?? "transparent" }} aria-hidden="true" />
              </div>

              <div className="ds-rail-cell">
                <span className="ds-rail-key">COLLAR / PLACKET</span>
                <code>{collarColor}</code>
                <i className="ds-rail-swatch" style={{ background: collarColor }} aria-hidden="true" />
              </div>

              <div className="ds-rail-cell ds-rail-nav">
                <button type="button" onClick={() => stepDesign(-1)} disabled={!selected} aria-label="Previous design">
                  <ArrowLeft size={17} strokeWidth={1.7} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => stepDesign(1)} disabled={!selected} aria-label="Next design">
                  <ArrowRight size={17} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>
            </aside>
          </div>
        </section>

        <div className="ds-marquee" aria-label="Archive ticker">
          <div className="ds-marquee-track">
            {[0, 1].map((copy) => (
              <div className="ds-marquee-group" key={copy} aria-hidden={copy === 1}>
                {designs.map((design) => (
                  <span key={`${copy}-${design.id}`}>
                    {design.id.toUpperCase()} <i>/</i> {design.title}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="ds-manifesto" aria-label="Studio principle">
          <p>
            {MANIFESTO.split(" ").map((word, index) => (
              <span className="ds-manifesto-word" key={`${word}-${index}`}>{word} </span>
            ))}
          </p>
        </section>

        <dl className="ds-contract-strip" aria-label="Template mapping">
          <div><dt>Main design</dt><dd>texture / webp</dd></div>
          <div><dt>Sleeve end</dt><dd>accent / manifest</dd></div>
          <div><dt>Collar + placket</dt><dd>hex / settings.json</dd></div>
          <div><dt>Model</dt><dd>1 GLB / runtime</dd></div>
        </dl>

        <section className="ds-notes" aria-label="Studio notes">
          <div className="ds-notes-stage">
            {STUDIO_NOTES.map((item, index) => {
              const thumb = designs.find((design) => design.category === item.key)?.thumb;
              return (
                <article
                  className={`ds-note-card ${activeNote === index ? "is-active" : ""}`}
                  key={item.id}
                  style={{ "--stack-i": index } as CSSProperties}
                >
                  {thumb && <img src={thumb} alt="" loading="lazy" draggable="false" />}
                  <div>
                    <span className="ds-note-key">NOTE / {item.key.toUpperCase()}</span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="ds-notes-controls">
            <span>{String(activeNote + 1).padStart(2, "0")} / {String(STUDIO_NOTES.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => setActiveNote((value) => (value - 1 + STUDIO_NOTES.length) % STUDIO_NOTES.length)} aria-label="Previous studio note">
              <ArrowLeft size={16} strokeWidth={1.7} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setActiveNote((value) => (value + 1) % STUDIO_NOTES.length)} aria-label="Next studio note">
              <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="ds-archive" id="ds-archive">
          <div className="ds-archive-grid">
            <div className="ds-archive-pin" ref={archivePinRef}>
              <h2>Pick a <em>design.</em></h2>
              <p className="ds-archive-lede">
                Click any artwork to load it on the jersey above. No reload, no second model —
                the archive is split into category rails.
              </p>
              <div className="ds-filters" role="group" aria-label="Filter designs by category">
                {FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={`filter${category === filter ? " active" : ""}`}
                    data-text={filter.toUpperCase()}
                    aria-pressed={category === filter}
                    onClick={() => setCategory(filter)}
                  >
                    <span>{filter.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              <span className="ds-archive-total">
                {String(filtered.length).padStart(3, "0")} DESIGNS IN VIEW
              </span>
            </div>

            <div className="ds-archive-rail" ref={archiveScrollRef}>
              <div className="ds-categories" id="ds-categories">
                {error && <p className="ds-error">{error}</p>}

                {category === "all" && (
                  <nav className="ds-category-jump" aria-label="Jump to a jersey category">
                    {sections.map((meta) => {
                      const thumb = designs.find((item) => item.category === meta.key)?.thumb;
                      return (
                        <a
                          key={meta.key}
                          href={`#ds-cat-${meta.key}`}
                          style={{ "--section-accent": meta.accent } as CSSProperties}
                        >
                          {thumb && <img src={thumb} alt="" loading="lazy" draggable="false" />}
                          <span className="ds-jump-text">
                            <b>{meta.label}</b>
                            <small>CAT / {meta.code} · {String(meta.items.length).padStart(2, "0")} KITS</small>
                          </span>
                          <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
                        </a>
                      );
                    })}
                  </nav>
                )}

                <div className="ds-category-list">
                  {sections.map((section) => (
                    <section
                      className="ds-category"
                      id={`ds-cat-${section.key}`}
                      key={section.key}
                      style={{ "--section-accent": section.accent } as CSSProperties}
                    >
                      <div className="ds-category-head">
                        <h3>{section.label} <em>jerseys.</em></h3>
                        <div className="ds-category-meta">
                          <span>CAT / {section.code}</span>
                          <span className="ds-category-count">
                            <b>{String(section.items.length).padStart(2, "0")}</b>
                            <i>DESIGNS</i>
                          </span>
                        </div>
                      </div>
                      <p className="ds-category-copy">{section.copy}</p>

                      {section.items.length > 0 ? (
                        <div className="ds-grid">
                          {section.items.map((design, index) => (
                            <button
                              type="button"
                              key={design.id}
                              className={`ds-card ${selected?.id === design.id ? "is-active" : ""}`}
                              onClick={() => selectDesign(design.id)}
                              aria-pressed={selected?.id === design.id}
                            >
                              <span className="ds-card-media">
                                <img src={design.thumb} alt={design.title} loading="lazy" />
                                <span className="ds-card-index">{String(index + 1).padStart(2, "0")}</span>
                                <span className="ds-card-arrow" aria-hidden="true"><ArrowUpRight size={17} strokeWidth={1.7} /></span>
                              </span>
                              <span className="ds-card-info">
                                <small>{design.category} / {design.id}</small>
                                <strong>{design.title}</strong>
                              </span>
                              <span className="ds-card-accent" style={{ background: design.accent }} aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="ds-category-empty">
                          <div>
                            <b>Coming soon.</b>
                            <span>Is category me abhi koi published design nahi hai.</span>
                          </div>
                          <a className="button button-outline" href="/#contact">START A DESIGN <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" /></a>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ds-outro">
          <h2>Want your own <em>design?</em></h2>
          <a className="button button-orange" href="/#contact">START A DESIGN <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" /></a>
        </section>
      </main>

      <footer className="ds-foot">
        <span>OM SAI SPORTS / DIGITAL FITTING STUDIO</span>
        <span>ONE MODEL / LIVE TEXTURES / FIXED COLLAR</span>
        <a href="/">BACK TO HOME <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
