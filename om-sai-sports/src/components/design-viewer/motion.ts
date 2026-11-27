import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type ContextSafe = ReturnType<typeof useGSAP>["contextSafe"];

type ViewerMotionParams = {
  rootRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  invalidate: () => void;
  onClosed: () => void;
};

type MotionApi = {
  swap: (change: () => void) => void;
  toast: (element: HTMLElement | null) => void;
  slip: (element: HTMLElement | null, open: boolean) => void;
  sheet: (element: HTMLElement | null, expanded: boolean) => void;
};

const VISIBLE_SELECTOR =
  ".dsv, .dsv-back-row, .dsv-floor-ring, .dsv-reveal-line, .dsv-control, .dsv-filmstrip, .dsv-bottom-bar, .dsv-hotspot-note";

export function useReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    setReduced(media.matches);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function useViewerMotion({
  rootRef,
  reducedMotion,
  invalidate,
  onClosed,
}: ViewerMotionParams) {
  const timelineRef: MutableRefObject<gsap.core.Timeline | null> = useRef(null);
  const apiRef: MutableRefObject<MotionApi | null> = useRef(null);
  const closingRef = useRef(false);
  const onClosedRef = useRef(onClosed);
  const invalidateRef = useRef(invalidate);
  onClosedRef.current = onClosed;
  invalidateRef.current = invalidate;

  const { contextSafe } = useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const rows = gsap.utils.toArray<HTMLElement>(".dsv-back-row", root);
      const ring = root.querySelector<HTMLElement>(".dsv-floor-ring-spin");
      const ringShell = root.querySelector<HTMLElement>(".dsv-floor-ring");
      const lines = gsap.utils.toArray<HTMLElement>(".dsv-reveal-line", root);
      const controls = gsap.utils.toArray<HTMLElement>(".dsv-control", root);
      const foot = root.querySelector<HTMLElement>(".dsv-bottom-bar");
      const filmstrip = root.querySelector<HTMLElement>(".dsv-filmstrip");

      apiRef.current = {
        swap: (change) => change(),
        toast: (element) => {
          if (element) gsap.set(element, { autoAlpha: 1, y: 0 });
        },
        slip: (element, open) => {
          if (element) gsap.set(element, { autoAlpha: open ? 1 : 0, y: open ? 0 : 12 });
        },
        sheet: (element, expanded) => {
          if (element) gsap.set(element, { y: expanded ? -window.innerHeight * 0.22 : 0 });
        },
      };

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(VISIBLE_SELECTOR, { clearProps: "clipPath,transform", autoAlpha: 1 });
        gsap.set(root, { autoAlpha: 1, clipPath: "none" });
        timelineRef.current = null;
        closingRef.current = false;

        return () => {
          apiRef.current = null;
        };
      });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const safeSwap = contextSafe((change: () => void) => {
          const stage = root.querySelector<HTMLElement>(".dsv-stage-visual");
          if (!stage || reducedMotion) {
            change();
            return;
          }
          gsap
            .timeline({ defaults: { overwrite: "auto" } })
            .to(stage, {
              scale: 0.94,
              rotationY: -14,
              rotationZ: 5,
              duration: 0.24,
              ease: "power2.inOut",
              onUpdate: () => invalidateRef.current(),
            })
            .add(change)
            .to(stage, {
              scale: 1,
              rotationY: 0,
              rotationZ: 0,
              duration: 0.46,
              ease: "back.out(1.5)",
              onUpdate: () => invalidateRef.current(),
            });
        });

        const safeToast = contextSafe((element: HTMLElement | null) => {
          if (!element) return;
          gsap.killTweensOf(element);
          gsap
            .timeline()
            .fromTo(
              element,
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" },
            )
            .to(element, { autoAlpha: 0, y: -6, duration: 0.28, ease: "power2.in" }, "+=1.1");
        });

        const safeSlip = contextSafe((element: HTMLElement | null, open: boolean) => {
          if (!element) return;
          gsap.killTweensOf(element);
          gsap.to(element, {
            autoAlpha: open ? 1 : 0,
            y: open ? 0 : 14,
            duration: open ? 0.3 : 0.2,
            ease: open ? "power3.out" : "power2.in",
          });
        });

        const safeSheet = contextSafe((element: HTMLElement | null, expanded: boolean) => {
          if (!element) return;
          gsap.to(element, {
            y: expanded ? -window.innerHeight * 0.22 : 0,
            duration: 0.42,
            ease: "power3.out",
          });
        });

        apiRef.current = {
          swap: safeSwap,
          toast: safeToast,
          slip: safeSlip,
          sheet: safeSheet,
        };

        gsap.set(root, {
          autoAlpha: 0,
          clipPath:
            "circle(0% at var(--dsv-origin-x, 50%) var(--dsv-origin-y, 50%))",
        });
        gsap.set([...rows, ...lines, ...controls, ringShell, foot, filmstrip].filter(Boolean), {
          autoAlpha: 0,
        });
        gsap.set(rows[0], { xPercent: -4 });
        if (rows[1]) gsap.set(rows[1], { xPercent: 4 });
        if (ringShell) gsap.set(ringShell, { scale: 0.7 });

        const timeline = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out" },
          onReverseComplete: () => {
            closingRef.current = false;
            onClosedRef.current();
          },
        });

        timeline
          .to(root, {
            autoAlpha: 1,
            clipPath:
              "circle(150% at var(--dsv-origin-x, 50%) var(--dsv-origin-y, 50%))",
            duration: 0.5,
          })
          .to(
            rows,
            {
              autoAlpha: 1,
              xPercent: 0,
              duration: 0.7,
              stagger: 0.08,
            },
            0.12,
          )
          .to(
            ringShell,
            { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(1.3)" },
            0.18,
          )
          .to(
            lines,
            { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.06 },
            0.2,
          )
          .to(
            controls,
            { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.05 },
            0.24,
          )
          .to(
            [filmstrip, foot].filter(Boolean),
            { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.04 },
            0.32,
          );

        gsap.set(lines, { y: 16 });
        gsap.set(controls, { x: 24 });
        gsap.set([filmstrip, foot].filter(Boolean), { y: 20 });

        timelineRef.current = timeline;
        timeline.play();

        const rowTweens = [
          rows[0] &&
            gsap.to(rows[0], {
              xPercent: 4,
              duration: 40,
              ease: "none",
              repeat: -1,
              yoyo: true,
            }),
          rows[1] &&
            gsap.to(rows[1], {
              xPercent: -4,
              duration: 40,
              ease: "none",
              repeat: -1,
              yoyo: true,
            }),
        ].filter(Boolean);

        const ringTween = ring
          ? gsap.to(ring, { rotation: 360, duration: 30, ease: "none", repeat: -1 })
          : null;
        const dragIcon = root.querySelector<HTMLElement>(".dsv-drag-icon");
        const dragTween = dragIcon
          ? gsap.to(dragIcon, {
              x: 7,
              duration: 1.2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            })
          : null;

        return () => {
          rowTweens.forEach((tween) => tween?.kill());
          ringTween?.kill();
          dragTween?.kill();
          timeline.kill();
          timelineRef.current = null;
          apiRef.current = null;
        };
      });

      return () => media.revert();
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  const playClose = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || closingRef.current) {
      onClosedRef.current();
      return;
    }
    closingRef.current = true;
    timeline.timeScale(2.7).reverse();
  }, []);

  const swap = useCallback((change: () => void) => {
    const api = apiRef.current;
    if (api) api.swap(change);
    else change();
  }, []);

  const toast = useCallback((element: HTMLElement | null) => {
    apiRef.current?.toast(element);
  }, []);

  const slip = useCallback((element: HTMLElement | null, open: boolean) => {
    apiRef.current?.slip(element, open);
  }, []);

  const sheet = useCallback((element: HTMLElement | null, expanded: boolean) => {
    apiRef.current?.sheet(element, expanded);
  }, []);

  return { timelineRef, playClose, swap, toast, slip, sheet };
}
