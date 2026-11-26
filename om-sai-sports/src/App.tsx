import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./features/hero/Hero";
import Gallery from "./features/gallery/Gallery";
import Clients from "./sections/Clients";
import Story from "./sections/Story";
import Process from "./sections/Process";
import Facts from "./sections/Facts";
import Journal from "./sections/Journal";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";
import Admin from "./features/admin/Admin";
import DesignDetail from "./features/design/DesignDetail";
import { getDesigns } from "./lib/data";
import type { Design } from "./types";

const DesignShowcase = lazy(() => import("./components/DesignShowcase"));

function RouteFallback({ label }: { label: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0b", color: "#f4f1ea" }}>
      {label}
    </div>
  );
}

function ShowcasePage() {
  return (
    <Suspense fallback={<RouteFallback label="Loading 3D designs…" />}>
      <DesignShowcase />
    </Suspense>
  );
}

function Home() {
  const { search } = useLocation();
  const [designs, setDesigns] = useState<Design[]>([]);
  useEffect(() => {
    let active = true;
    getDesigns().then((next) => { if (active) setDesigns(next); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (new URLSearchParams(search).get("mode") === "designs") return <ShowcasePage />;
  return <><Navbar /><main><Hero /><Clients /><Gallery designs={designs} /><Story /><Process /><Facts /><Journal designs={designs} /><Contact /></main><Footer /></>;
}

function HashScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const targetId = hash.slice(1);
    let frame = 0;
    let cancelled = false;
    const scroll = () => {
      if (cancelled) return;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (frame++ < 90) {
        requestAnimationFrame(scroll);
      }
    };
    const timer = window.setTimeout(scroll, 60);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <HashScroll />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/designs" element={<ShowcasePage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/design/:id" element={<DesignDetail />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
