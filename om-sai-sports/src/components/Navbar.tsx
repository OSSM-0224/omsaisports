import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999";
const whatsappUrl = `https://wa.me/${whatsappNumber}`;
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || "hello@omsaisports.com";
const contactPhone = import.meta.env.VITE_CONTACT_PHONE || "+91 XXXXX XXXXX";

type PillLink = { label: string; hash?: string; href?: string };

const pillLinks: PillLink[] = [
  { label: "Designs", hash: "#designs" },
  { label: "Categories", href: "/designs#ds-categories" },
  { label: "Story", hash: "#story" },
  { label: "Clients", hash: "#clients" },
  { label: "Contact", hash: "#contact" }
];

type MenuItem = {
  label: string;
  hash?: string;
  href?: string;
  number: string;
  tag: string;
  title: string;
  copy: string;
  color: string;
  image: string;
  alt: string;
};

const menuItems: MenuItem[] = [
  {
    label: "Designs",
    hash: "#designs",
    number: "01",
    tag: "THE ARCHIVE",
    title: "Made to be worn.",
    copy: "Teamwear concepts built around your colours, your crest and your game. Find the one that feels like yours.",
    color: "#FF5A00",
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
    alt: "Custom teamwear design from the OM SAI SPORTS archive"
  },
  {
    label: "Categories",
    href: "/designs#ds-categories",
    number: "02",
    tag: "BY DESIGN TYPE",
    title: "Find your lane.",
    copy: "Sports, festival or commercial — browse the archive in clean category rails and open any jersey in the 3D studio.",
    color: "#D8F26A",
    image: "/designs/festival/ganpati1-thumb.webp",
    alt: "Festival jersey design from the OM SAI SPORTS archive"
  },
  {
    label: "Story",
    hash: "#story",
    number: "03",
    tag: "SINCE 2000",
    title: "One machine. One dream.",
    copy: "Twenty-five years of making jerseys with a story — from a single machine to teams across the Navi Mumbai region.",
    color: "#A9C7FF",
    image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=900&q=80",
    alt: "Sports team gathered on the field"
  },
  {
    label: "Clients",
    hash: "#clients",
    number: "04",
    tag: "GOOD COMPANY",
    title: "Trusted by big spirit.",
    copy: "Schools, colleges and clubs who trust us with their colours, their crests and their biggest match days.",
    color: "#F5B8C8",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=900&q=80",
    alt: "Cricket stadium under floodlights"
  },
  {
    label: "Journal",
    hash: "#journal",
    number: "05",
    tag: "THE WORKSHOP",
    title: "Fresh off the press.",
    copy: "New drops, work in progress and small notes from the workshop floor. See what we have been making lately.",
    color: "#FFB37A",
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=900&q=80",
    alt: "Sports equipment and training detail"
  },
  {
    label: "Contact",
    hash: "#contact",
    number: "06",
    tag: "START HERE",
    title: "Let’s make yours.",
    copy: "Tell us about your team. Share a colour, a crest or a rough idea and we’ll take it from there.",
    color: "#FAF6F0",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
    alt: "Team preparing for a match"
  }
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuLinkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const closeTimer = useRef<number | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 24);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!isHome) {
      setActiveSection("");
      return;
    }
    const sections = ["designs", "story", "clients", "contact"]
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-38% 0px -48% 0px", threshold: [0, 0.2, 0.5, 1] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome, pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    return () => document.documentElement.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      document.documentElement.classList.remove("menu-open");
    };
  }, []);

  function openMenu() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    pendingAction.current = null;
    dialog.classList.remove("is-open");

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const pad = window.innerWidth <= 700 ? 0 : 10;
      dialog.style.setProperty("--clip-top", `${Math.max(0, rect.top - pad)}px`);
      dialog.style.setProperty("--clip-right", `${Math.max(0, window.innerWidth - rect.right - pad)}px`);
      dialog.style.setProperty("--clip-bottom", `${Math.max(0, window.innerHeight - rect.bottom - pad)}px`);
      dialog.style.setProperty("--clip-left", `${Math.max(0, rect.left - pad)}px`);
    }

    if (!dialog.open) dialog.showModal();
    setOpen(true);
    setActiveIndex(0);
    requestAnimationFrame(() => {
      menuLinkRefs.current[0]?.focus({ preventScroll: true });
      requestAnimationFrame(() => dialog.classList.add("is-open"));
    });
  }

  function closeMenu(after?: () => void) {
    const dialog = dialogRef.current;
    if (!dialog?.open) {
      after?.();
      return;
    }
    pendingAction.current = after ?? null;
    dialog.classList.remove("is-open");
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      dialog.close();
      closeTimer.current = null;
      pendingAction.current?.();
      pendingAction.current = null;
    }, prefersReducedMotion() ? 0 : 280);
  }

  function navigateTo(hash: string) {
    closeMenu(() => {
      if (!isHome) {
        window.location.assign(`/${hash}`);
        return;
      }
      const target = document.querySelector(hash);
      target?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
      window.history.replaceState(null, "", hash);
    });
  }

  function goHome() {
    closeMenu(() => {
      if (!isHome) {
        window.location.assign("/");
        return;
      }
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      window.history.replaceState(null, "", "/");
    });
  }

  const activeItem = menuItems[activeIndex];

  return (
    <>
      <header className="site-head">
        <div className={`glass-pill${scrolled ? " is-scrolled" : ""}`}>
          <a className="brand-lockup" href={isHome ? "#top" : "/"} aria-label="OM SAI SPORTS — back to home" data-cursor="HOME">
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
              <span className="brand-sub">Custom teamwear / est. 2000</span>
            </span>
          </a>

          <nav className="pill-nav" aria-label="Primary navigation">
            {pillLinks.map((link) => (
              <a
                key={link.label}
                className="pill-link"
                data-text={link.label}
                data-cursor={link.label.toUpperCase()}
                href={link.href ?? (isHome ? link.hash : `/${link.hash}`)}
                aria-current={
                  link.href
                    ? pathname === link.href.split("#")[0] ? "page" : undefined
                    : activeSection === link.hash?.slice(1) ? "location" : undefined
                }
                onClick={(event) => {
                  if (!link.hash) return;
                  if (!isHome) return;
                  event.preventDefault();
                  navigateTo(link.hash);
                }}
              >
                <span>{link.label}</span>
              </a>
            ))}
          </nav>

          <button
            ref={triggerRef}
            className="pill-menu"
            type="button"
            data-cursor="OPEN"
            onClick={openMenu}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="site-menu"
          >
            <span>Menu</span>
            <span className="pill-menu-dots" aria-hidden="true"><i /><i /><i /><i /></span>
          </button>

          <span
            className="pill-progress"
            aria-hidden="true"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id="site-menu"
        className="menu-dialog"
        aria-label="Site menu"
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        onClose={() => setOpen(false)}
      >
        <div
          className="menu-shell"
          style={{ "--menu-accent": activeItem.color } as CSSProperties}
        >
          <div className="menu-top">
            <a
              className="menu-brand"
              href="/"
              data-cursor="HOME"
              onClick={(event) => {
                event.preventDefault();
                goHome();
              }}
            >
              <img
                className="brand-mark brand-mark--menu"
                src="/brand/oss-shield-sm.png"
                width="96"
                height="120"
                alt=""
                aria-hidden="true"
                draggable="false"
              />
              OM SAI <em>SPORTS.</em>
            </a>
            <span className="menu-meta">Navi Mumbai / India — time on the field</span>
            <button className="menu-close" type="button" data-cursor="CLOSE" onClick={() => closeMenu()}>
              <span>Close</span>
              <span className="menu-close-icon"><X size={16} /></span>
            </button>
          </div>

          <div className="menu-body">
            <div className="menu-index">
              <span className="menu-eyebrow">INDEX / 01—06</span>
              <nav className="menu-list" aria-label="Site sections">
                {menuItems.map((item, index) => (
                  <a
                    key={item.label}
                    ref={(node) => { menuLinkRefs.current[index] = node; }}
                    className="menu-item"
                    href={item.href ?? (isHome ? item.hash : `/${item.hash}`)}
                    data-cursor="GO TO"
                    style={{ "--item-color": item.color, "--item-index": index } as CSSProperties}
                    aria-current={
                      item.href
                        ? pathname === item.href.split("#")[0] ? "page" : undefined
                        : activeSection === item.hash?.slice(1) ? "location" : undefined
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={(event) => {
                      event.preventDefault();
                      if (item.href) {
                        const target = item.href;
                        closeMenu(() => window.location.assign(target));
                        return;
                      }
                      if (item.hash) navigateTo(item.hash);
                    }}
                  >
                    <span className="menu-item-num">{item.number}</span>
                    <span className="menu-item-label" data-text={item.label}><span>{item.label}</span></span>
                    <span className="menu-item-arrow"><ArrowUpRight size={17} /></span>
                  </a>
                ))}
              </nav>
            </div>

            <aside className="menu-preview">
              <div className="menu-preview-art">
                {menuItems.map((item, index) => (
                  <img
                    key={item.label}
                    src={item.image}
                    alt={index === activeIndex ? item.alt : ""}
                    aria-hidden={index === activeIndex ? undefined : "true"}
                    loading={index === 0 ? "eager" : "lazy"}
                    className={index === activeIndex ? "is-active" : undefined}
                  />
                ))}
                <span className="menu-preview-tag"><i />{activeItem.tag}</span>
                <span className="menu-preview-color" aria-hidden="true" />
              </div>
              <div className="menu-preview-copy">
                <b>{activeItem.title}</b>
                <p>{activeItem.copy}</p>
              </div>
              <a
                className="menu-preview-cta"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                data-cursor="CHAT"
              >
                Start a conversation <ArrowUpRight size={14} />
              </a>
            </aside>
          </div>

          <div className="menu-foot">
            <span className="menu-copy">© {new Date().getFullYear()} OM SAI SPORTS</span>
            <div className="menu-foot-links">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={13} /></a>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`}>{contactPhone}</a>
            </div>
            <span className="menu-location">NAVI MUMBAI / IN</span>
          </div>
        </div>
      </dialog>
    </>
  );
}
