import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import "../design-showcase.css";
import DesignCard, { type DesignCardDesign } from "./DesignCard";

const Design3DModal = lazy(() => import("./Design3DModal"));

type CategoryKey = "sports" | "ganpati" | "devi" | "commercial";

type ShowcaseItem = {
  id: string;
  title: string;
  category: CategoryKey;
  image: string;
  tag: string;
  designImage?: string;
  accent?: string;
  madeFor?: string;
  seasonYear?: string;
  jerseyNumber?: string;
  colors?: [string, string] | string[];
  specs?: string[];
  isNew?: boolean;
};

type CategoryMeta = {
  key: CategoryKey;
  label: string;
  code: string;
  description: string;
  accent: string;
};

const CATEGORY_META: CategoryMeta[] = [
  {
    key: "sports",
    label: "Sports",
    code: "SP",
    description: "Match kits, training jerseys, and team identities built for movement and presence.",
    accent: "#ff5a24",
  },
  {
    key: "ganpati",
    label: "Ganpati",
    code: "GN",
    description: "Festival editions with devotional artwork, bold colour, and celebration energy.",
    accent: "#ff9f1c",
  },
  {
    key: "devi",
    label: "Devi",
    code: "DV",
    description: "Powerful festive designs shaped around devotion, detail, and cultural character.",
    accent: "#d8a7ff",
  },
  {
    key: "commercial",
    label: "Commercial",
    code: "CO",
    description: "Brand-led and promotional jerseys designed for visibility, teams, and campaigns.",
    accent: "#a9c7ff",
  },
];

const THUMBNAIL_ITEMS: ShowcaseItem[] = [
  {
    id: "ganpati-1",
    title: "Ganpati Edition 01",
    category: "ganpati",
    image: "/thumbnails/ganpati/New%20Design%20072.png",
    tag: "Festival Jersey",
    designImage: "/designs/festival/ganpati1.webp",
    accent: "#000828",
    madeFor: "Ganpati Utsav",
    seasonYear: "2026",
    jerseyNumber: "01",
    colors: ["#000828", "#F4EFE6"],
    specs: ["Festival edition", "Sublimation print", "Custom artwork"],
  },
  {
    id: "slhs-crest-2026",
    title: "SLHS 24 — Xavier Edition",
    category: "sports",
    image: "/thumbnails/sports/St%20Xaivers%202026%20Design.png",
    tag: "Sports Jersey",
    designImage: "/designs/sports/slhs-crest.webp",
    accent: "#8d2438",
    madeFor: "SLHS",
    seasonYear: "2026",
    jerseyNumber: "24",
    colors: ["#8d2438", "#E8DCC0"],
    specs: ["Polo collar", "Raglan sleeves", "Sublimation print"],
  },
  {
    id: "nhps-1",
    title: "NHPS — Sports Edition 01",
    category: "sports",
    image: "/thumbnails/sports/nhps1.png",
    tag: "Sports Jersey",
    designImage: "/designs/sports/nhps1.webp",
    accent: "#8da8c1",
    madeFor: "NHPS",
    seasonYear: "2026",
    jerseyNumber: "01",
    colors: ["#8da8c1", "#0d1533"],
    specs: ["Sports kit", "Sublimation print", "Team identity"],
    isNew: true,
  },
  {
    id: "bvpt-1",
    title: "BVPT — Sports Edition 01",
    category: "sports",
    image: "/thumbnails/sports/bvpt1.png",
    tag: "Sports Jersey",
    designImage: "/designs/sports/bvpt1.webp",
    accent: "#03707c",
    madeFor: "BVPT",
    seasonYear: "2026",
    jerseyNumber: "01",
    colors: ["#03707c", "#f4efe6"],
    specs: ["Sports kit", "Sublimation print", "Team identity"],
    isNew: true,
  },
  {
    id: "devi-1",
    title: "Devi — Festival Edition",
    category: "devi",
    image: "/thumbnails/devi/devi1.png",
    tag: "Festival Jersey",
    designImage: "/designs/festival/devi1.webp",
    accent: "#ffffff",
    madeFor: "Devi Utsav",
    seasonYear: "2026",
    jerseyNumber: "01",
    colors: ["#ffffff", "#D4A017"],
    specs: ["Festival edition", "Sublimation print", "Custom artwork"],
  },
  {
    id: "devi-2",
    title: "Devi Edition 02",
    category: "devi",
    image: "/thumbnails/sports/devi2.png",
    tag: "Festival Jersey",
    designImage: "/designs/devi/devi2.webp",
    accent: "#cbe6a0",
    madeFor: "Devi Utsav",
    seasonYear: "2026",
    jerseyNumber: "02",
    colors: ["#e3f9c8", "#0c0c0d"],
    specs: ["Festival edition", "Sublimation print", "Custom artwork"],
    isNew: true,
  },
];

const FILTERS: Array<"all" | CategoryKey> = ["all", "sports", "ganpati", "devi", "commercial"];

function formatCount(value: number) {
  return String(value).padStart(2, "0");
}

export default function DesignShowcase() {
  const [category, setCategory] = useState<"all" | CategoryKey>("all");
  const [query, setQuery] = useState("");
  const [activeItem, setActiveItem] = useState<ShowcaseItem | null>(null);

  useEffect(() => {
    document.title = "Design Categories — OM SAI SPORTS";
  }, []);

  useEffect(() => {
    if (!activeItem || activeItem.designImage) return;
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

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return THUMBNAIL_ITEMS.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const sections = useMemo(
    () =>
      CATEGORY_META.map((meta) => ({
        ...meta,
        items: items.filter((item) => item.category === meta.key),
      })).filter((section) => category === "all" || section.key === category),
    [category, items]
  );

  const visibleCount = items.length;
  const activeCategoryCount = CATEGORY_META.filter((meta) =>
    THUMBNAIL_ITEMS.some((item) => item.category === meta.key)
  ).length;

  return (
    <div className="ds-site ds-categories-page">
      <header className="site-head" role="banner">
        <div className="glass-pill" style={{ width: "min(1080px, calc(100% - 24px))" }}>
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
            <a className="pill-link" data-text="Archive" href="/#designs"><span>Archive</span></a>
            <a className="pill-link" data-text="Contact" href="/#contact"><span>Contact</span></a>
          </nav>
          <a className="pill-menu" href="/#contact" aria-label="Start a design">
            <span>Start a design</span>
          </a>
        </div>
      </header>

      <main className="ds-main ds-categories-main">
        <section className="ds-cat-hero" aria-labelledby="categories-title">
          <div className="ds-cat-hero-copy">
            <h1 id="categories-title">
              Designs made for <em>every arena.</em>
            </h1>
            <p className="ds-cat-hero-lede">
              Browse jersey designs by category, from sports kits to festival editions. Clean presentation, clear categories, and room for every design to stand on its own.
            </p>
            <div className="ds-cat-hero-actions">
              <a className="button button-orange" href="/#contact">
                START A DESIGN <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
              <a className="button button-outline" href="/#designs">
                VIEW ARCHIVE <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="ds-cat-hero-panel">
            <div className="ds-cat-stat-card">
              <b>{formatCount(visibleCount)}</b>
              <span>Designs visible</span>
            </div>
            <div className="ds-cat-stat-card">
              <b>{formatCount(activeCategoryCount)}</b>
              <span>Active categories</span>
            </div>
            <div className="ds-cat-stat-card ds-cat-stat-card-wide">
              <b>{formatCount(CATEGORY_META.length)}</b>
              <span>Category collections</span>
            </div>
          </div>
        </section>

        <section className="ds-categories-shell" id="ds-categories">
          <div className="ds-categories-toolbar">
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
            <label className="ds-cat-search">
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">Search designs</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search design or category"
              />
            </label>
          </div>

          <nav className="ds-category-jump" aria-label="Jump to a jersey category">
            {CATEGORY_META.map((meta, index) => {
              const preview = THUMBNAIL_ITEMS.find((item) => item.category === meta.key);
              const count = THUMBNAIL_ITEMS.filter((item) => item.category === meta.key).length;
              return (
                <a
                  key={meta.key}
                  href={`#ds-cat-${meta.key}`}
                  className="ds-category-jump-card"
                  style={{ "--section-accent": meta.accent } as CSSProperties}
                >
                  <span className="ds-jump-media">
                    {preview ? (
                      <img src={preview.image} alt="" loading="lazy" draggable="false" />
                    ) : (
                      <span className="ds-jump-media-empty" aria-hidden="true" />
                    )}
                    <span className="ds-jump-index">0{index + 1}</span>
                  </span>
                  <span className="ds-jump-body">
                    <span className="ds-jump-top">
                      <b>{meta.label}</b>
                      <ArrowUpRight size={16} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <small>{formatCount(count)} designs</small>
                    <span className="ds-jump-copy">{meta.description}</span>
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="ds-category-list">
            {sections.map((section) => (
              <section
                className="ds-category"
                id={`ds-cat-${section.key}`}
                key={section.key}
                style={{ "--section-accent": section.accent } as CSSProperties}
              >
                <div className="ds-category-head">
                  <div className="ds-category-titleblock">
                    <h2>{section.label} <em>designs.</em></h2>
                    <p className="ds-category-copy">{section.description}</p>
                  </div>
                  <div className="ds-category-meta">
                    <span className="ds-category-code">CAT / {section.code}</span>
                    <span className="ds-category-count">
                      <b>{formatCount(section.items.length)}</b>
                      <i>Designs</i>
                    </span>
                  </div>
                </div>

                {section.items.length > 0 ? (
                  <div className="ds-grid">
                    {section.items.map((item, index) => {
                      const design: DesignCardDesign = {
                        designId: item.id.toUpperCase(),
                        title: item.title,
                        madeFor: item.madeFor || section.label,
                        seasonYear: item.seasonYear || "2026",
                        jerseyNumber: item.jerseyNumber || formatCount(index + 1),
                        colors: item.colors || [item.accent || section.accent, "#F4EFE6"],
                        specs: item.specs || [item.tag, "Custom design"],
                        frontUrl: item.image,
                        isNew: item.isNew,
                      };
                      return (
                        <DesignCard
                          key={item.id}
                          design={design}
                          onOpen={() => setActiveItem(item)}
                          eager={index < 2}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="ds-category-empty">
                    <div className="ds-category-empty-copy">
                      <b>No designs yet</b>
                      <span>Designs added to the {section.label.toLowerCase()} thumbnail folder will appear here.</span>
                    </div>
                    <a className="button button-outline" href="/#contact">
                      START A DESIGN <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>
      </main>

      {activeItem && activeItem.designImage ? (
        <Suspense fallback={<div className="ds-preview"><div className="ds-preview-dialog ds-preview-dialog-3d" style={{ minHeight: 320, display: "grid", placeItems: "center" }}><div className="ds-preview-loading" style={{ position: "static" }}>Loading 3D view…</div></div></div>}>
          <Design3DModal item={activeItem} onClose={() => setActiveItem(null)} />
        </Suspense>
      ) : activeItem ? (
        <div className="ds-preview" role="dialog" aria-modal="true" aria-label={activeItem.title} onClick={() => setActiveItem(null)}>
          <div className="ds-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="ds-preview-close" onClick={() => setActiveItem(null)} aria-label="Close preview">
              <X size={18} strokeWidth={1.8} />
            </button>
            <img src={activeItem.image} alt={activeItem.title} className="ds-preview-image" />
            <div className="ds-preview-meta">
              <p>{activeItem.category}</p>
              <h3>{activeItem.title}</h3>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
