import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, type MotionValue, useReducedMotion } from "motion/react";
import { useTheme } from "../../hooks/useTheme";
import { HERO_DEFAULT_POSTER } from "../../lib/seedData.ts";
import { getHeroVideoSources } from "../../lib/storage.ts";
import type { SiteSettings } from "../../types/index";

interface HeroBackgroundProps {
  siteSettings: SiteSettings;
  observeTargetRef?: React.RefObject<HTMLElement | null>;
  bgScale?: MotionValue<number>;
  bgDarkenOpacity?: MotionValue<number>;
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_isLight;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  // 2D Simplex noise
  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
     -0.577350269189626,
      0.024390243902439
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float heightField(vec2 p, float t) {
    float n1 = snoise(p * 1.15 + vec2(t * 0.42, -t * 0.28));
    float n2 = snoise(p * 2.15 + vec2(-t * 0.30, t * 0.22));
    float foldA = sin(p.x * 2.5 + p.y * 1.45 + t * 0.85 + n1 * 1.55);
    float foldB = sin(p.x * 4.3 - p.y * 2.35 - t * 0.55 + n2 * 1.15) * 0.52;
    float drape = snoise(vec2(p.x * 0.75 + p.y * 0.6, p.y * 0.85) + t * 0.16) * 0.48;
    return foldA * 0.60 + foldB * 0.36 + drape * 0.34;
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    p *= 1.65;

    float t = u_time;
    float eps = 0.0085;
    float h = heightField(p, t);
    float hx = heightField(p + vec2(eps, 0.0), t);
    float hy = heightField(p + vec2(0.0, eps), t);

    // Derive surface normal from finite differences
    vec3 normal = normalize(vec3((h - hx) / eps * 0.28, (h - hy) / eps * 0.28, 1.0));
    vec3 lightDir = normalize(vec3(0.58, 0.42, 0.70));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);

    float wrapDiffuse = clamp(dot(normal, lightDir) * 0.52 + 0.48, 0.0, 1.0);
    float diffuse = pow(wrapDiffuse, 2.0);
    float sheen = pow(max(dot(normal, halfVec), 0.0), 16.0);
    float peak = pow(max(dot(normal, halfVec), 0.0), 64.0);

    // Subtle right-side composition bias so headline stays darker on the left
    float rightBias = smoothstep(-0.25, 0.85, uv.x);

    vec3 colBlack = vec3(0.047, 0.047, 0.051);      // #0C0C0D
    vec3 colBurnt = vec3(0.478, 0.165, 0.0);        // #7A2A00
    vec3 colOrange = vec3(1.0, 0.353, 0.0);         // #FF5A00
    vec3 colCream = vec3(0.957, 0.937, 0.902);      // #F4EFE6

    vec3 darkColor = mix(colBlack, colBurnt, diffuse * (0.45 + 0.55 * rightBias));
    darkColor = mix(darkColor, colOrange, sheen * (0.42 + 0.46 * rightBias));
    darkColor = mix(darkColor, colCream, peak * 0.13 * rightBias);

    // Light mode: warm cream satin silk (#FAF6F0 -> #EAD7C3 -> #FF8A47/#FF5A00 sheen)
    vec3 colLightBase = vec3(0.980, 0.965, 0.941);  // #FAF6F0
    vec3 colLightFold = vec3(0.914, 0.835, 0.753);  // warm oat fold shadow
    vec3 colLightTint = vec3(1.0, 0.62, 0.36);      // soft sunlit orange silk bounce
    vec3 lightColor = mix(colLightBase, colLightFold, diffuse * (0.52 + 0.45 * rightBias));
    lightColor = mix(lightColor, colLightTint, sheen * (0.35 + 0.42 * rightBias));
    lightColor = mix(lightColor, colOrange, peak * 0.24 * rightBias);

    vec3 color = mix(darkColor, lightColor, clamp(u_isLight, 0.0, 1.0));

    // Very light film grain
    float grain = (hash12(gl_FragCoord.xy + fract(t * 7.0) * 120.0) - 0.5) * 0.022;
    color = clamp(color + grain, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function isLowBandwidthConnection(): boolean {
  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  const conn = nav.connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (
    conn.effectiveType &&
    ["slow-2g", "2g", "3g"].includes(conn.effectiveType)
  ) {
    return true;
  }
  return (
    typeof conn.downlink === "number" &&
    conn.downlink > 0 &&
    conn.downlink < 1.5
  );
}

export function HeroBackground({
  siteSettings,
  observeTargetRef,
  bgScale,
  bgDarkenOpacity,
}: HeroBackgroundProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const prefersReducedMotion = Boolean(useReducedMotion());
  const localContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [pageLoaded, setPageLoaded] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.readyState === "complete"
      : false,
  );
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? isLowBandwidthConnection() : false,
  );
  const [isSmallMobile, setIsSmallMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [inView, setInView] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [shaderReady, setShaderReady] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [posterError, setPosterError] = useState(false);

  // Wait until window load event so video/heavy hydration never blocks LCP
  useEffect(() => {
    if (document.readyState === "complete") {
      setPageLoaded(true);
      return;
    }
    const onLoad = () => setPageLoaded(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Track viewport size & network changes
  useEffect(() => {
    const onResize = () => setIsSmallMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });

    const nav = navigator as Navigator & {
      connection?: NetworkInformationLike;
    };
    const conn = nav.connection;
    const onConnChange = () => setLowBandwidth(isLowBandwidthConnection());
    conn?.addEventListener?.("change", onConnChange);

    return () => {
      window.removeEventListener("resize", onResize);
      conn?.removeEventListener?.("change", onConnChange);
    };
  }, []);

  // Track whether the hero is visible in the viewport
  useEffect(() => {
    const target = observeTargetRef?.current || localContainerRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.02 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [observeTargetRef]);

  const posterOnly = prefersReducedMotion || lowBandwidth;

  const videoSources = useMemo(
    () =>
      getHeroVideoSources(
        siteSettings.heroVideoUrl,
        siteSettings.heroMobileVideoUrl,
        isSmallMobile,
      ),
    [siteSettings.heroVideoUrl, siteSettings.heroMobileVideoUrl, isSmallMobile],
  );

  // Plan A video applies if enabled, URL set, and on mobile only if a lighter mobile source exists
  const shouldUseVideo =
    !posterOnly &&
    siteSettings.heroUseVideo &&
    Boolean(siteSettings.heroVideoUrl.trim()) &&
    (!isSmallMobile || videoSources.hasLightMobileSource) &&
    Boolean(videoSources.mp4 || videoSources.webm);

  // Reset video fade when source changes
  useEffect(() => {
    setVideoReady(false);
  }, [videoSources.mp4, videoSources.webm, shouldUseVideo]);

  // Pause/resume video with viewport visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldUseVideo || !pageLoaded) return;
    if (inView && document.visibilityState === "visible") {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, shouldUseVideo, pageLoaded]);

  // Plan B: Lightweight raw WebGL Silk Fabric Shader
  const shouldRunShader = !posterOnly && !shouldUseVideo && !webglUnavailable;

  useEffect(() => {
    if (!shouldRunShader) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setWebglUnavailable(true);
      return;
    }

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vert || !frag) {
      setWebglUnavailable(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglUnavailable(true);
      return;
    }

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      setWebglUnavailable(true);
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const isLightLoc = gl.getUniformLocation(program, "u_isLight");

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const rawDpr = window.devicePixelRatio || 1;
      // Cap DPR at 1.5 desktop, reduced resolution on small mobile screens
      const dpr =
        window.innerWidth < 768
          ? Math.min(rawDpr, 0.85)
          : Math.min(rawDpr, 1.5);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resizeCanvas();
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeCanvas)
        : null;
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener("resize", resizeCanvas, { passive: true });

    let lastScrollY = window.scrollY;
    let scrollBoost = 0;
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastScrollY);
      lastScrollY = currentY;
      scrollBoost = Math.min(scrollBoost + delta * 0.00045, 0.035);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let isTabVisible = document.visibilityState === "visible";
    let isVisibleInDom = inView;
    const onVisibilityChange = () => {
      isTabVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let rafId = 0;
    let lastTick = performance.now();
    let lastDraw = 0;
    let shaderTime = 0;
    let firstFrameDrawn = false;
    const FRAME_MS = 1000 / 30; // ~30fps cap

    const renderFrame = (now: number) => {
      rafId = window.requestAnimationFrame(renderFrame);

      if (!isTabVisible || !isVisibleInDom) {
        lastTick = now;
        return;
      }

      const elapsedSinceDraw = now - lastDraw;
      if (elapsedSinceDraw < FRAME_MS) {
        return;
      }

      const dtSeconds = Math.min((now - lastTick) / 1000, 0.1);
      lastTick = now;
      lastDraw = now;

      // Slow base motion (time * 0.05) + gentle decaying scroll speed boost
      shaderTime += dtSeconds * 0.05 + scrollBoost;
      scrollBoost *= 0.91;
      if (scrollBoost < 0.0001) scrollBoost = 0;

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, shaderTime);
      gl.uniform1f(isLightLoc, isLightRef.current ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!firstFrameDrawn) {
        firstFrameDrawn = true;
        setShaderReady(true);
      }
    };

    // Keep visibility synced cleanly inside closure without restarting GL context
    const targetEl = observeTargetRef?.current || localContainerRef.current;
    const localObserver =
      targetEl && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              isVisibleInDom = Boolean(entries[0]?.isIntersecting);
            },
            { threshold: 0.02 },
          )
        : null;
    if (localObserver && targetEl) localObserver.observe(targetEl);

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      localObserver?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      try {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vert);
        gl.deleteShader(frag);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // Ignore teardown issues on already-lost context
      }
      setShaderReady(false);
    };
  }, [shouldRunShader, observeTargetRef]);

  const activePoster =
    siteSettings.heroPosterUrl?.trim() || HERO_DEFAULT_POSTER;

  return (
    <div
      ref={localContainerRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden bg-[var(--desk)] pointer-events-none select-none"
      style={{
        backgroundImage: isLight
          ? "radial-gradient(ellipse at 72% 42%, rgba(255,90,0,0.18) 0%, rgba(234,215,195,0.55) 48%, #FAF6F0 100%)"
          : "radial-gradient(ellipse at 72% 42%, rgba(122,42,0,0.65) 0%, rgba(36,13,2,0.85) 48%, #0C0C0D 100%)",
      }}
    >
      <motion.div
        style={
          prefersReducedMotion || !bgScale ? undefined : { scale: bgScale }
        }
        className="absolute inset-0 will-change-transform origin-center"
      >
        {/* a) POSTER: instant LCP element */}
        {!posterError && (
          <img
            src={activePoster}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            onError={() => setPosterError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isLight ? "opacity-20" : "opacity-100"
            }`}
          />
        )}

        {/* c) SILK FABRIC SHADER (Plan B) */}
        {shouldRunShader && (
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full block transition-opacity duration-500 ${
              shaderReady ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* b) VIDEO (Plan A, deferred until after load event) */}
        {shouldUseVideo && pageLoaded && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={activePoster}
            onPlaying={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ease-out ${
              videoReady
                ? isLight
                  ? "opacity-35"
                  : "opacity-100"
                : "opacity-0"
            }`}
          >
            {videoSources.webm && (
              <source src={videoSources.webm} type="video/webm" />
            )}
            {videoSources.mp4 && (
              <source src={videoSources.mp4} type="video/mp4" />
            )}
          </video>
        )}
      </motion.div>

      {/* d) OVERLAYS FOR WCAG AA LEGIBILITY */}
      <div
        className={`absolute inset-0 ${isLight ? "bg-[#FAF6F0]/15" : "bg-black/15"}`}
      />

      {/* Left-to-right gradient keeping left-side headline WCAG AA legible */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "linear-gradient(90deg, rgba(250,246,240,0.92) 0%, rgba(250,246,240,0.68) 44%, rgba(250,246,240,0.18) 76%, rgba(250,246,240,0) 100%)"
            : "linear-gradient(90deg, rgba(12,12,13,0.85) 0%, rgba(12,12,13,0.58) 42%, rgba(12,12,13,0.12) 76%, rgba(12,12,13,0) 100%)",
        }}
      />

      {/* Bottom gradient blending seamlessly into section desk */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "linear-gradient(180deg, rgba(250,246,240,0) 56%, rgba(250,246,240,0.78) 84%, #FAF6F0 100%)"
            : "linear-gradient(180deg, rgba(12,12,13,0) 56%, rgba(12,12,13,0.75) 84%, #0C0C0D 100%)",
        }}
      />

      {/* Scroll-driven fade/darken layer into next section */}
      {bgDarkenOpacity && !prefersReducedMotion && (
        <motion.div
          style={{ opacity: bgDarkenOpacity }}
          className="absolute inset-0 bg-[var(--desk)]"
        />
      )}
    </div>
  );
}
