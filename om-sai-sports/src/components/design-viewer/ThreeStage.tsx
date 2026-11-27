import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sparkles } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as THREE from "three";
import TemplateJersey from "../TemplateJersey";
import type { SpinState } from "../../lib/spin";
import {
  CAMERA_PRESETS,
  STAGE_CONFIG,
  jerseyHotspots,
  type CameraPreset,
  type ViewerDesign,
} from "./config";
import DisplayStand from "./DisplayStand";
import type { HotspotElementMap } from "./HotspotOverlay";

gsap.registerPlugin(useGSAP);

export type StageApi = {
  setView: (preset: CameraPreset) => void;
  reset: () => void;
  invalidate: () => void;
};

type Props = {
  design: ViewerDesign;
  reducedMotion: boolean;
  autoRotate: boolean;
  dustCount: number;
  glow: string;
  accent: string;
  hotspotRegistry: MutableRefObject<HotspotElementMap>;
  introRef: RefObject<number>;
  spinRef: RefObject<SpinState>;
  apiRef: MutableRefObject<StageApi | null>;
  onInteracted: () => void;
  onLoaded: () => void;
  fallback: ReactNode;
};

let webglSupport: boolean | null = null;

export function hasWebGL() {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    webglSupport = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

type BoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError: () => void;
};

class StageErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type SceneProps = Omit<Props, "fallback">;

function Scene({
  design,
  reducedMotion,
  autoRotate,
  dustCount,
  glow,
  accent,
  hotspotRegistry,
  introRef,
  spinRef,
  apiRef,
  onInteracted,
  onLoaded,
}: SceneProps) {
  const { camera, invalidate, size } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const jerseyGroup = useRef<THREE.Group>(null);
  const cameraTween = useRef<gsap.core.Timeline | null>(null);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const projection = useMemo(
    () => ({
      anchor: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      toCamera: new THREE.Vector3(),
      ndc: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
    }),
    [],
  );

  const { contextSafe } = useGSAP(
    () => {
      if (reducedMotion) {
        introRef.current = 1;
        invalidate();
        return;
      }
      introRef.current = 0;
      const tween = gsap.to(introRef, {
        current: 1,
        duration: 0.7,
        delay: 0.12,
        ease: "power3.out",
        onUpdate: invalidate,
      });
      return () => tween.kill();
    },
    { dependencies: [reducedMotion, invalidate] },
  );

  const setView = useCallback(
    contextSafe((preset: CameraPreset) => {
      const next = CAMERA_PRESETS[preset] || CAMERA_PRESETS.home;
      cameraTween.current?.kill();

      if (reducedMotion) {
        camera.position.set(...next.position);
        if (controls.current) {
          controls.current.target.set(...next.target);
          controls.current.update();
        }
        invalidate();
        return;
      }

      const target = controls.current?.target;
      const timeline = gsap.timeline({
        defaults: { duration: 0.6, ease: "power3.inOut" },
        onUpdate: () => {
          controls.current?.update();
          invalidate();
        },
      });
      timeline.to(camera.position, {
        x: next.position[0],
        y: next.position[1],
        z: next.position[2],
      });
      if (target) {
        timeline.to(target, {
          x: next.target[0],
          y: next.target[1],
          z: next.target[2],
        }, 0);
      }
      cameraTween.current = timeline;
    }),
    [contextSafe, camera, invalidate, reducedMotion],
  );

  useEffect(() => {
    apiRef.current = {
      setView,
      reset: () => setView("home"),
      invalidate: () => invalidate(),
    };
    return () => {
      cameraTween.current?.kill();
      apiRef.current = null;
    };
  }, [apiRef, invalidate, setView]);

  useFrame(() => {
    const group = jerseyGroup.current;
    if (group) {
      const progress = reducedMotion ? 1 : THREE.MathUtils.clamp(introRef.current, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      group.rotation.y = -Math.PI * (1 - eased);
      group.scale.setScalar(0.8 + eased * 0.2);
      group.updateWorldMatrix(true, false);
      projection.matrix.copy(group.matrixWorld);
    } else {
      projection.matrix.identity();
    }

    const registry = hotspotRegistry.current;
    if (registry.size > 0) {
      for (const spot of jerseyHotspots) {
        const element = registry.get(spot.id);
        if (!element) continue;
        projection.anchor.set(...spot.position).applyMatrix4(projection.matrix);
        projection.normal.set(...spot.normal).transformDirection(projection.matrix);
        projection.toCamera.copy(camera.position).sub(projection.anchor).normalize();
        const facing = projection.toCamera.dot(projection.normal) > 0.04;
        projection.ndc.copy(projection.anchor).project(camera);
        const visible =
          facing &&
          projection.ndc.z > -1 &&
          projection.ndc.z < 1 &&
          projection.ndc.x > -1.1 &&
          projection.ndc.x < 1.1 &&
          projection.ndc.y > -1.1 &&
          projection.ndc.y < 1.1;
        const x = ((projection.ndc.x + 1) / 2) * size.width;
        const y = ((1 - projection.ndc.y) / 2) * size.height;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        element.style.visibility = visible ? "visible" : "hidden";
        element.style.opacity = visible ? "1" : "0";
        element.style.pointerEvents = visible ? "auto" : "none";
      }
    }

    if (!reducedMotion) invalidate();
  });

  const handleModelClick = (event: ThreeEvent<MouseEvent>) => {
    if (!import.meta.env.DEV) return;
    event.stopPropagation();
    const group = jerseyGroup.current;
    const local = group ? group.worldToLocal(scratch.copy(event.point)) : event.point;
    const round = (value: number) => Math.round(value * 100) / 100;
    console.info(
      "[jerseyHotspots] candidate",
      JSON.stringify(
        {
          id: "new-detail",
          label: "New detail",
          position: [round(local.x), round(local.y), round(local.z)],
          normal: [0, 0, 1],
          cameraPreset: "detail",
          note: "Add a one-line note here.",
        },
        null,
        2,
      ),
    );
  };

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#fff3e5", "#1a1110", 0.5]} />
      <directionalLight
        castShadow
        position={[3.5, 5, 4]}
        intensity={2.35}
        color="#fff4ea"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-3.5, 2.6, -4]} intensity={2.1} color={glow} />
      <Environment resolution={64} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.5}
          color="#fff4ea"
          position={[0, 4.4, 3.2]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color={glow}
          position={[-4, 2.2, -2.6]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[5, 3, 1]}
        />
        <Lightformer
          form="ring"
          intensity={2.1}
          color={accent}
          position={[0, 2, -4]}
          scale={[3, 3, 1]}
        />
      </Environment>

      {dustCount > 0 ? (
        <Sparkles
          count={dustCount}
          size={STAGE_CONFIG.dust.size}
          scale={[12, 8, 4]}
          speed={STAGE_CONFIG.dust.speed}
          color={glow}
          opacity={0.34}
        />
      ) : null}

      <DisplayStand accent={accent} introRef={introRef} reducedMotion={reducedMotion} />

      <group ref={jerseyGroup} onClick={handleModelClick}>
        <TemplateJersey
          design={design}
          start
          autoRotate={false}
          spinRef={spinRef}
          introRef={introRef}
          reducedMotion={reducedMotion}
          baseX={STAGE_CONFIG.jersey.baseX}
          baseY={STAGE_CONFIG.jersey.baseY}
          onLoaded={onLoaded}
        />
      </group>

      <OrbitControls
        makeDefault
        target={STAGE_CONFIG.camera.target}
        enableDamping
        dampingFactor={0.055}
        enablePan={false}
        minPolarAngle={STAGE_CONFIG.camera.minPolarAngle}
        maxPolarAngle={STAGE_CONFIG.camera.maxPolarAngle}
        minDistance={STAGE_CONFIG.camera.minDistance}
        maxDistance={STAGE_CONFIG.camera.maxDistance}
        autoRotate={autoRotate && !reducedMotion}
        autoRotateSpeed={0.42}
        onStart={onInteracted}
        onChange={() => invalidate()}
      />
    </>
  );
}

export default function ThreeStage(props: Props) {
  const { fallback, onLoaded, ...sceneProps } = props;
  return (
    <StageErrorBoundary fallback={fallback} onError={onLoaded}>
      <Canvas
        shadows="percentage"
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{
          position: STAGE_CONFIG.camera.position,
          fov: STAGE_CONFIG.camera.fov,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
      >
        <Suspense fallback={null}>
          <Scene {...sceneProps} onLoaded={onLoaded} />
        </Suspense>
      </Canvas>
    </StageErrorBoundary>
  );
}
