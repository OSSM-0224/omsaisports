import { useCallback, useEffect, useState } from "react";

export type RouteMatch =
  | { view: "home" }
  | { view: "design"; designId: string }
  | { view: "admin" };

function parsePath(pathname: string): RouteMatch {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/admin") {
    return { view: "admin" };
  }
  const designMatch = clean.match(/^\/design\/([^/]+)$/i);
  if (designMatch) {
    return { view: "design", designId: decodeURIComponent(designMatch[1]) };
  }
  return { view: "home" };
}

export function useRouter() {
  const [route, setRoute] = useState<RouteMatch>(() =>
    parsePath(window.location.pathname),
  );

  useEffect(() => {
    const handlePop = () => {
      setRoute(parsePath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, "", to);
    }
    setRoute(parsePath(to));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const targetId = sectionId.replace(/^#/, "");
      if (route.view !== "home") {
        window.history.pushState({}, "", "/");
        setRoute({ view: "home" });
        window.setTimeout(() => {
          document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 80);
        return;
      }
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    },
    [route.view],
  );

  return { route, navigate, scrollToSection };
}
