import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import "../design-showcase.css";
import { getDesigns, type JerseyDesign } from "../lib/designs";
import DesignCard, { type DesignCardDesign } from "./DesignCard";

const Design3DModal = lazy(() => import("./Design3DModal"));

const PAGE_SIZE = 24;
const ORDER_HREF = "/#contact";

function formatCount(value: number) {
  return String(value).padStart(2, "0");
}

function toCardDesign(design: JerseyDesign, index: number): DesignCardDesign {
  return {
    designId: design.id.toUpperCase(),
    title: design.title,
    madeFor: design.madeFor || design.tag || "Custom",
    seasonYear: design.seasonYear || "2026",
    jerseyNumber: design.jerseyNumber || formatCount(index + 1),
    colors: design.colors?.length ? design.colors : [design.accent || "#ff5a00", "#f4efe6"],
    specs: design.specs?.length ? design.specs : [design.tag || "Jersey Design", "Custom design"],
    compositeUrl: design.thumb,
    isNew: design.isNew,
  };
}

function toModalItem(design: JerseyDesign) {
  return {
    id: design.id,
    title: design.title,
    category: design.category,
    tag: design.tag || "Jersey Design",
    image: design.thumb,
    designImage: design.image || design.thumb,
    accent: design.accent,
  };
}

function GallerySkeleton() {
  return (
    <div className="ds-gallery-grid" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="ds-gallery-cell ds-gallery-cell-skeleton" key={index}>
          <div className="ds-skeleton-card" />
        </div>
      ))}
    </div>
  );
}

export default function DesignShowcase() {
  const [designs, setDesigns] = useState<JerseyDesign[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeItem, setActiveItem] = useState<JerseyDesign | null>(null);

  const loadDesigns = useCallback(() => {
    setStatus("loading");
    setError("");
    getDesigns()
      .then((next) => {
        setDesigns(next);
        setVisibleCount(PAGE_SIZE);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "The jersey archive could not be loaded.");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    document.title = "Jersey Archive - OM SAI SPORTS";
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  useEffect(() => {
    if (!activeItem) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveItem(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeItem]);

  const visibleDesigns = useMemo(() => designs.slice(0, visibleCount), [designs, visibleCount]);
  const remaining = designs.length - visibleDesigns.length;
  const activeModalItem = useMemo(() => (activeItem ? toModalItem(activeItem) : null), [activeItem]);

  return (
    <div className="ds-site ds-archive-page">
      <header className="site-head" role="banner">
        <div className="glass-pill">
          <a className="brand-lockup" href="/" aria-label="OM SAI SPORTS home">
            <img className="brand-mark" src="/brand/oss-shield-sm.png" width="96" height="120" alt="" draggable="false" />
            <span className="brand-words">
              <span className="brand-name">
                OM SAI <em>SPORTS.</em>
              </span>
              <span className="brand-sub">Custom teamwear / est. 2000</span>
            </span>
          </a>
          <nav className="pill-nav" aria-label="Primary navigation">
            <a className="pill-link" data-text="Home" href="/"><span>Home</span></a>
            <a className="pill-link" data-text="Archive" href="/designs"><span>Archive</span></a>
            <a className="pill-link" data-text="Contact" href={ORDER_HREF}><span>Contact</span></a>
          </nav>
          <a className="pill-menu" href={ORDER_HREF}>
            <span>Order Jersey</span>
          </a>
        </div>
      </header>

      <main className="ds-archive-main">
        <section className="ds-archive-masthead" aria-labelledby="archive-title">
          <div className="ds-archive-copy">
            <h1 id="archive-title">
              Jerseys worth <em>showing off.</em>
            </h1>
            <p>Every design in one clean archive. Pick a favourite, then order your custom jersey.</p>
          </div>
          <div className="ds-archive-side">
            <a className="button button-orange ds-order-button" href={ORDER_HREF}>
              ORDER JERSEY <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <span className="ds-archive-count">{formatCount(designs.length)} designs in the archive</span>
          </div>
        </section>

        {status === "loading" ? (
          <section className="ds-gallery" aria-busy="true" aria-label="Loading jersey designs">
            <GallerySkeleton />
          </section>
        ) : status === "error" ? (
          <section className="ds-state" role="alert">
            <b>The archive could not load.</b>
            <span>{error || "Please try again in a moment."}</span>
            <button type="button" className="button button-outline" onClick={loadDesigns}>
              TRY AGAIN
            </button>
          </section>
        ) : designs.length === 0 ? (
          <section className="ds-state">
            <b>No jerseys added yet.</b>
            <span>Add front and back images to design-sources/incoming, then run the design prep script.</span>
          </section>
        ) : (
          <>
            <section className="ds-gallery" id="ds-archive" aria-label="Jersey designs">
              <div className="ds-gallery-grid">
                {visibleDesigns.map((design, index) => (
                  <div className="ds-gallery-cell" key={design.id}>
                    <DesignCard
                      design={toCardDesign(design, index)}
                      onOpen={() => setActiveItem(design)}
                      eager={index < 4}
                    />
                  </div>
                ))}
              </div>

              {remaining > 0 ? (
                <div className="ds-load-more">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, designs.length))}
                  >
                    SHOW MORE DESIGNS
                    <span>{formatCount(remaining)} left</span>
                  </button>
                </div>
              ) : null}
            </section>

            <section className="ds-order-band">
              <div>
                <h2>Like a design? Make it yours.</h2>
                <p>Send us the design number and your team details. We will take it from there.</p>
              </div>
              <a className="button button-orange ds-order-button" href={ORDER_HREF}>
                ORDER JERSEY <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </section>
          </>
        )}
      </main>

      {activeModalItem ? (
        <Suspense fallback={<div className="ds-preview"><div className="ds-preview-dialog ds-preview-dialog-3d ds-preview-fallback">Loading 3D view…</div></div>}>
          <Design3DModal item={activeModalItem} onClose={() => setActiveItem(null)} />
        </Suspense>
      ) : null}
    </div>
  );
}
