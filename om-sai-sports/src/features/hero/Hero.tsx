import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import SculptureHero from "@/components/ui/liquid-sculpture-hero";
import { HeroBackground } from "./HeroBackground.tsx";
import { defaultSiteSettings, getSiteSettings } from "../../lib/siteSettings";
import type { SiteSettings } from "../../lib/siteSettings";

const counterValues = ["01", "02", "03", "04", "05"];

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [activeCard, setActiveCard] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let active = true;
    getSiteSettings()
      .then((next) => {
        if (active) setSettings(next);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setActiveCard((card) => (card + 1) % counterValues.length),
      4600,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;
    let heroTop = 0;
    let heroHeight = 1;

    const update = () => {
      frame = 0;
      const progress = Math.min(
        1,
        Math.max(0, (window.scrollY - heroTop) / heroHeight),
      );
      hero.style.setProperty("--hero-progress", progress.toFixed(4));
      const nextScrolled = window.scrollY > 80;
      setScrolled((current) =>
        current === nextScrolled ? current : nextScrolled,
      );
    };

    const measure = () => {
      const rect = hero.getBoundingClientRect();
      heroTop = rect.top + window.scrollY;
      heroHeight = Math.max(hero.offsetHeight, 1);
      update();
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section
      id="top"
      className={`hero${scrolled ? " is-scrolled" : ""}`}
      ref={heroRef}
    >
      <HeroBackground settings={settings} appearance="dark" />
      <div className="hero-copy">
        <h1>
          <span>WE DRESS</span>
          <span>THE TEAM</span>
          <span>BEHIND THE</span>
          <span className="orange-word">
            VICTORY<span className="period">.</span>
          </span>
        </h1>
        <p className="hero-lede">
          <span>Custom jerseys for schools, colleges &amp; clubs.</span>
          <span>Crafted at OM SAI SPORTS, Navi Mumbai region, since 2000.</span>
        </p>
        <div className="hero-actions">
          <a href="#designs" className="button button-orange">
            Explore designs <ArrowDownRight size={17} />
          </a>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999"}`}
            className="button button-outline"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="hero-stats">
          <div>
            <b>
              25<span>+</span>
            </b>
            <small>YEARS MAKING</small>
          </div>
          <div>
            <b>
              20<span>+</span>
            </b>
            <small>SCHOOLS &amp; CLUBS</small>
          </div>
          <div>
            <b>
              1000<span>s</span>
            </b>
            <small>JERSEYS MADE</small>
          </div>
        </div>
      </div>
      <div className="hero-wall-wrap">
        <div className="jersey-number">10</div>
        <SculptureHero
          src="/HeroSectionbackgrounImage.png"
          darkSrc="/HeroSectionbackgrounImage.png"
          mobileSrc="/HeroSectionbackgrounImage.png"
          mobileDarkSrc="/HeroSectionbackgrounImage.png"
          imageAlt="OM SAI SPORTS custom jersey collection in a liquid particle wall"
          theme="dark"
          background="#0C0C0D"
          darkBackground="#0C0C0D"
          textColor="#F7F1E9"
          accentColor="#FF5A00"
          headingFont="'Space Grotesk', 'DM Sans', sans-serif"
          accentFont="'Space Grotesk', 'DM Sans', sans-serif"
          bodyFont="'DM Sans', sans-serif"
          loadFonts={false}
          showNav={false}
          showContent={false}
          showCredit={false}
          themeToggle={false}
          backdropText=""
          height="100%"
          className="hero-liquid-sculpture"
          interactive
          strength={1.15}
          radius={200}
          particleDensity={0.85}
          dotSize={1}
          particleSpread={1}
          turbulence={1.1}
          liquid={1.2}
          restStyle="image"
          returnSpeed={1.1}
          ambient={false}
          speed={0.85}
          intro={false}
          sculptureFit="contain"
          sculptureScale={1}
          mobileSculptureScale={1}
        />
        <div className="latest-sticker">LATEST DROP ↓</div>
      </div>
      <div className="hero-counter" aria-hidden="true">
        <span className="hero-counter-window">
          <span
            className="hero-counter-reel"
            style={{ transform: `translateY(-${activeCard}em)` }}
          >
            {counterValues.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </span>
        </span>
        <span className="hero-counter-slash">/</span>
        <span className="hero-counter-total">05</span>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span>Scroll to explore</span>
        <i>↓</i>
      </div>
      <div className="hero-progress" aria-hidden="true">
        <i />
      </div>
      <div className="marquee hero-marquee" aria-hidden="true">
        <div>
          {Array(4)
            .fill(
              "SCHOOLS ✦ COLLEGES ✦ CLUBS ✦ MARATHONS ✦ CRICKET ✦ FOOTBALL ✦ KABADDI ✦ SINCE 2000 ✦ ",
            )
            .map((x, i) => (
              <span key={i}>{x}</span>
            ))}
        </div>
      </div>
    </section>
  );
}
