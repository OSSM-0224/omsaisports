import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "../../lib/siteSettings";

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function getConnection() {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

function dataSaverActive() {
  const connection = getConnection();
  if (!connection) return false;
  if (connection.saveData) return true;
  return ["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? "");
}

function useLowPowerMode() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [dataSaver, setDataSaver] = useState(dataSaverActive);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChangeMotion = () => setReducedMotion(motion.matches);
    motion.addEventListener?.("change", onChangeMotion);

    const connection = getConnection();
    const onChangeConnection = () => setDataSaver(dataSaverActive());
    connection?.addEventListener?.("change", onChangeConnection);

    return () => {
      motion.removeEventListener?.("change", onChangeMotion);
      connection?.removeEventListener?.("change", onChangeConnection);
    };
  }, []);

  return reducedMotion || dataSaver;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scroll;
varying vec2 v_uv;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
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

float fbm(vec2 p) {
  float sum = 0.0;
  sum += 0.68 * snoise(p);
  sum += 0.32 * snoise(p * 2.03 + 13.1);
  return sum;
}

float cloth(vec2 p, float t) {
  float warp = fbm(p * 0.85 + vec2(t * 0.36, -t * 0.24));
  vec2 q = p + vec2(warp * 0.42, warp * 0.2);
  q += vec2(sin(q.y * 1.4 + t * 0.8), cos(q.x * 1.2 - t * 0.7)) * 0.12;
  float h = sin(q.x * 2.35 + q.y * 1.05 + t * 1.1) * 0.46;
  h += sin(q.y * 3.9 - q.x * 1.7 - t * 0.82) * 0.27;
  h += sin((q.x + q.y) * 4.9 + t * 0.55) * 0.11;
  h += fbm(q * 1.75 + vec2(-t * 0.5, t * 0.32)) * 0.5;
  return h;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = vec2((v_uv.x - 0.5) * aspect, v_uv.y - 0.5) * 1.85;
  float t = u_time * 0.05 + u_scroll * 0.5;

  float h = cloth(p, t);
  float e = 0.0055;
  float hx = cloth(p + vec2(e, 0.0), t) - h;
  float hy = cloth(p + vec2(0.0, e), t) - h;
  vec3 n = normalize(vec3(-hx / e * 0.055, -hy / e * 0.055, 1.0));

  vec3 lightA = normalize(vec3(-0.55, 0.72, 0.6));
  vec3 lightB = normalize(vec3(0.7, 0.2, 0.45));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diffA = clamp(dot(n, lightA), 0.0, 1.0);
  float diffB = clamp(dot(n, lightB), 0.0, 1.0);
  float sharp = pow(clamp(dot(n, normalize(lightA + viewDir)), 0.0, 1.0), 38.0);
  float sheen = pow(clamp(dot(n, normalize(lightB + viewDir)), 0.0, 1.0), 7.0);

  float lum = clamp(diffA * 0.62 + diffB * 0.22 + h * 0.18 + 0.08, 0.0, 1.0);

  vec3 cBlack = vec3(0.047, 0.047, 0.051);
  vec3 cBurnt = vec3(0.478, 0.165, 0.0);
  vec3 cOrange = vec3(1.0, 0.353, 0.0);
  vec3 cCream = vec3(1.0, 0.925, 0.815);

  vec3 color = mix(cBlack, cBurnt, smoothstep(0.1, 0.58, lum));
  color = mix(color, cOrange, smoothstep(0.55, 0.92, lum) * 0.92);
  color += cOrange * sheen * 0.12;
  color = mix(color, cCream, smoothstep(0.72, 1.0, sharp) * 0.15);

  float glow = smoothstep(1.4, 0.05, length(p - vec2(0.62, 0.08)));
  color += cBurnt * glow * 0.42;

  float crease = smoothstep(0.02, 0.35, abs(hx / e) * 0.01);
  color += cOrange * crease * 0.02;

  float vignette = smoothstep(1.65, 0.42, length(p * vec2(0.82, 1.0)));
  color *= mix(0.54, 1.0, vignette);

  float grain = fract(sin(dot(gl_FragCoord.xy + u_time * 37.0, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.032;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
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

function SilkCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "hero-canvas";
    host.appendChild(canvas);

    const context = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power"
    });
    if (!context) {
      canvas.remove();
      return;
    }
    const gl = context;

    const fail = () => {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      fail();
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      fail();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      fail();
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      fail();
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const scroll = gl.getUniformLocation(program, "u_scroll");
    if (position < 0) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      fail();
      return;
    }

    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0.047, 0.047, 0.051, 1);

    let frame = 0;
    let visible = true;
    let hidden = document.hidden;
    let last = performance.now();
    let lastDraw = 0;
    let elapsed = 0;
    let boost = 0;
    let previousScroll = window.scrollY;
    let firstFrame = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const mobile = window.matchMedia("(max-width: 720px)").matches;
      const quality = mobile ? 0.68 : 0.85;
      let width = Math.max(1, Math.round(canvas.clientWidth * dpr * quality));
      let height = Math.max(1, Math.round(canvas.clientHeight * dpr * quality));
      const maxPixels = 2100000;
      if (width * height > maxPixels) {
        const scale = Math.sqrt(maxPixels / (width * height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      const delta = Math.min((now - last) / 1000, 0.08);
      last = now;

      if (!visible || hidden) return;
      if (now - lastDraw < 32) return;
      lastDraw = now;

      resize();
      boost *= Math.exp(-delta * 2.2);
      elapsed += delta * (1 + boost * 2.5);

      const hero = canvas.closest(".hero");
      let heroProgress = 0;
      if (hero) {
        const top = hero.getBoundingClientRect().top;
        heroProgress = Math.min(1, Math.max(0, -top / Math.max(hero.clientHeight, 1)));
      }

      gl.useProgram(program);
      if (resolution) gl.uniform2f(resolution, canvas.width, canvas.height);
      if (time) gl.uniform1f(time, elapsed);
      if (scroll) gl.uniform1f(scroll, heroProgress);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (firstFrame) {
        firstFrame = false;
        canvas.classList.add("is-ready");
      }
    }

    function onScroll() {
      const y = window.scrollY;
      boost = Math.min(1.6, boost + Math.abs(y - previousScroll) * 0.012);
      previousScroll = y;
    }

    function onVisibility() {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    }

    function onContextLost(event: Event) {
      event.preventDefault();
      visible = false;
      canvas.style.opacity = "0";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) last = performance.now();
      },
      { rootMargin: "80px" }
    );
    observer.observe(canvas);

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);

    resize();
    gl.clear(gl.COLOR_BUFFER_BIT);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="hero-canvas-slot" />;
}

type HeroBackgroundProps = {
  settings: SiteSettings;
  className?: string;
};

export default function HeroBackground({ settings, className = "" }: HeroBackgroundProps) {
  const lowPower = useLowPowerMode();
  const [pageReady, setPageReady] = useState(() => typeof document !== "undefined" && document.readyState === "complete");
  const [posterSrc, setPosterSrc] = useState(settings.hero_poster_url.trim() || "/hero-poster.svg");
  const [videoState, setVideoState] = useState<"idle" | "ready" | "error">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = settings.hero_video_url.trim();
  const wantsVideo = settings.hero_use_video && Boolean(videoSrc) && !lowPower;
  const showVideo = wantsVideo && pageReady;
  const showShader = !lowPower && (!wantsVideo || videoState === "error");

  useEffect(() => {
    setPosterSrc(settings.hero_poster_url.trim() || "/hero-poster.svg");
  }, [settings.hero_poster_url]);

  useEffect(() => {
    setVideoState("idle");
  }, [videoSrc, settings.hero_use_video]);

  useEffect(() => {
    if (pageReady) return;
    const onLoad = () => setPageReady(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [pageReady]);

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      void video.play().catch(() => setVideoState("error"));
    };
    video.addEventListener("canplay", play);
    if (video.readyState >= 2) play();
    return () => video.removeEventListener("canplay", play);
  }, [showVideo]);

  const videoType = /\.webm($|\?)/i.test(videoSrc) ? "video/webm" : "video/mp4";

  return (
    <div className={`hero-background ${className}`.trim()} aria-hidden="true">
      <div className="hero-media">
        <img
          className="hero-poster"
          src={posterSrc}
          alt=""
          width="1920"
          height="1080"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={() => {
            if (posterSrc !== "/hero-poster.svg") setPosterSrc("/hero-poster.svg");
          }}
        />
        {showShader && <SilkCanvas />}
        {showVideo && (
          <video
            ref={videoRef}
            className={`hero-video${videoState === "ready" ? " is-ready" : ""}`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onPlaying={() => setVideoState("ready")}
            onError={() => setVideoState("error")}
          >
            <source src={videoSrc} type={videoType} />
          </video>
        )}
      </div>
      <div className="hero-dim" />
      <div className="hero-tint" />
      <div className="hero-shade hero-shade-left" />
      <div className="hero-shade hero-shade-bottom" />
      <div className="hero-grain" />
    </div>
  );
}
