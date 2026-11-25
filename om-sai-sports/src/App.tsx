import { useEffect, useState } from "react";
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

function Home() {
  const [designs, setDesigns] = useState<Design[]>([]);
  useEffect(() => {
    let active = true;
    getDesigns().then((next) => { if (active) setDesigns(next); }).catch(() => {});
    return () => { active = false; };
  }, []);
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
      } else if (frame++ < 30) {
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
        <Route path="/admin" element={<Admin />} />
        <Route path="/design/:id" element={<DesignDetail />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
