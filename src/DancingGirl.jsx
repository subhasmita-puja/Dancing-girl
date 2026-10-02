import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  useGLTF,
  ContactShadows,
  Sparkles,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import { MathUtils } from "three";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => x * x * (3 - 2 * x); // smoothstep

function ClubStage({ isPlaying, speed }) {
  const redSpotRef = useRef();
  const goldSpotRef = useRef();
  const outerRingRef = useRef();
  const innerRingRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * (isPlaying ? speed : 0.25);
    const pulse = (Math.sin(t * 4.5) + 1) * 0.5; // 0 to 1 beat pulse

    // Sway spotlights across the stage
    if (redSpotRef.current) {
      redSpotRef.current.position.x = Math.sin(t * 1.5) * 3.5;
      redSpotRef.current.intensity = isPlaying ? 3.5 + pulse * 2.5 : 2;
    }
    if (goldSpotRef.current) {
      goldSpotRef.current.position.x = Math.cos(t * 1.5) * -3.5;
      goldSpotRef.current.intensity = isPlaying ? 3 + (1 - pulse) * 2.5 : 1.8;
    }

    // Pulse neon floor rings on the beat
    if (outerRingRef.current) {
      const s = 1 + (isPlaying ? pulse * 0.06 : 0);
      outerRingRef.current.scale.set(s, s, 1);
    }
    if (innerRingRef.current) {
      const s = 1 + (isPlaying ? (1 - pulse) * 0.05 : 0);
      innerRingRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, -1.35, 0]}>
      {/* Dynamic Colored Salsa Club Lights */}
      <pointLight
        ref={redSpotRef}
        position={[3, 5, 2]}
        color="#ff1e56"
        intensity={4}
        distance={15}
      />
      <pointLight
        ref={goldSpotRef}
        position={[-3, 5, 2]}
        color="#ffac41"
        intensity={3.5}
        distance={15}
      />
      {/* Warm Front Key Light so her face is clearly visible */}
      <pointLight
        position={[0, 3.2, 3.2]}
        color="#fff5eb"
        intensity={2.8}
        distance={10}
      />
      {/* Rim Backlight for Silhouette */}
      <spotLight
        position={[0, 6, -4]}
        angle={0.6}
        penumbra={0.8}
        intensity={5}
        color="#ec4899"
      />

      {/* Circular Dance Floor Stage */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.3, 0.1, 64]} />
        <meshStandardMaterial
          color="#16060b"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Inner Golden Glow Ring */}
      <mesh
        ref={innerRingRef}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.5, 1.56, 64]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* Outer Crimson Glow Ring */}
      <mesh
        ref={outerRingRef}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.02, 2.1, 64]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>

      {/* Floating Fiesta Sparkles */}
      <Sparkles
        count={65}
        scale={[7, 5, 7]}
        position={[0, 2.2, 0]}
        size={isPlaying ? 3.5 : 1.8}
        speed={isPlaying ? 0.8 * speed : 0.2}
        opacity={0.75}
        color="#fde68a"
      />

      {/* Grounding Shadows under feet */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.75}
        scale={6}
        blur={2}
        far={4}
        color="#000000"
      />
    </group>
  );
}

function GirlModel({ isPlaying, speed }) {
  const { scene } = useGLTF("/models/girl_rigged_character.glb");

  // Find all bones
  const bones = useMemo(() => {
    const found = {};
    scene.traverse((object) => {
      if (object.isBone) found[object.name] = object;
    });
    return found;
  }, [scene]);

  // Save the original pose
  const originalRotations = useMemo(() => {
    const rotations = {};
    Object.entries(bones).forEach(([name, bone]) => {
      rotations[name] = {
        x: bone.rotation.x,
        y: bone.rotation.y,
        z: bone.rotation.z,
      };
    });
    return rotations;
  }, [bones]);

  const time = useRef(0);
  const boneKeyCache = useRef({});

  // Base Y position aligned with the raised stage
  const BASE_Y = -1.35;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeSpeed = isPlaying ? speed : 0.2;
    time.current += dt * activeSpeed;
    const t = time.current;

    const amp = isPlaying ? 1 : 0.22;
    const SMOOTH = 14;

    const moveBone = (name, x = 0, y = 0, z = 0) => {
      let key = boneKeyCache.current[name];
      if (key === undefined) {
        key =
          bones[name] !== undefined
            ? name
            : Object.keys(bones).find((k) => k.startsWith(name + "_")) ||
              Object.keys(bones).find((k) => k.startsWith(name)) ||
              null;
        boneKeyCache.current[name] = key;
      }
      if (!key) return;

      const bone = bones[key];
      const original = originalRotations[key];
      if (!bone || !original) return;

      bone.rotation.x = MathUtils.damp(
        bone.rotation.x,
        original.x + x * amp,
        SMOOTH,
        dt
      );
      bone.rotation.y = MathUtils.damp(
        bone.rotation.y,
        original.y + y * amp,
        SMOOTH,
        dt
      );
      bone.rotation.z = MathUtils.damp(
        bone.rotation.z,
        original.z + z * amp,
        SMOOTH,
        dt
      );
    };

    // =====================================================
    // RHYTHM
    // =====================================================
    const phase = t * 4.5;
    const beat = Math.sin(phase);
    const fastBeat = Math.sin(phase * 2);
    const sway = Math.cos(phase);

    const weightL = 0.5 - 0.5 * beat;
    const weightR = 1 - weightL;

    const liftL = ease(clamp01(beat));
    const liftR = ease(clamp01(-beat));

    const bounce = 0.5 - 0.5 * Math.cos(phase * 2);

    // =====================================================
    // LEFT ARM
    // =====================================================
    moveBone("CC_Base_L_Clavicle_049", 0, 0, -0.08 + beat * 0.1);
    moveBone(
      "CC_Base_L_Upperarm_050",
      -0.12 + beat * 0.2,
      0.04,
      -0.15 + beat * 0.18
    );
    moveBone("CC_Base_L_Forearm_051", 0, beat * 0.12, -0.18 + fastBeat * 0.12);
    moveBone("CC_Base_L_Hand_055", 0, 0, fastBeat * 0.15);

    // =====================================================
    // RIGHT ARM
    // =====================================================
    moveBone("CC_Base_R_Clavicle_077", 0, 0, 0.08 - beat * 0.1);
    moveBone(
      "CC_Base_R_Upperarm_078",
      -0.12 - beat * 0.2,
      -0.04,
      0.15 - beat * 0.18
    );
    moveBone("CC_Base_R_Forearm_079", 0, -beat * 0.12, 0.18 - fastBeat * 0.12);
    moveBone("CC_Base_R_Hand_083", 0, 0, -fastBeat * 0.15);

    // =====================================================
    // PELVIS
    // =====================================================
    moveBone("CC_Base_Hip", 0, sway * 0.1, beat * 0.06);
    moveBone("CC_Base_Pelvis", 0, -sway * 0.12, -beat * 0.1);

    // =====================================================
    // SPINE
    // =====================================================
    moveBone("CC_Base_Waist", 0, sway * 0.07, beat * 0.03);
    moveBone("CC_Base_Spine01", 0, sway * 0.06, beat * 0.04);
    moveBone("CC_Base_Spine02", 0, sway * 0.07, beat * 0.05);

    // =====================================================
    // LEGS
    // =====================================================
    const leg = (weight, lift, side) => {
      const thighX = -lift * 0.42 - weight * 0.06 - bounce * weight * 0.07;
      const calfX = lift * 0.75 + weight * 0.1 + bounce * weight * 0.14;
      const footX = -(thighX + calfX) * (0.4 + 0.6 * weight) + lift * 0.18;
      const thighZ = side * (0.04 + weight * 0.03 - lift * 0.05);
      const thighY = -side * sway * 0.05;

      return { thighX, calfX, footX, thighZ, thighY };
    };

    const L = leg(weightL, liftL, -1);
    const R = leg(weightR, liftR, 1);

    moveBone("CC_Base_L_Thigh", L.thighX, L.thighY, L.thighZ);
    moveBone("CC_Base_L_Calf", L.calfX, 0, 0);
    moveBone("CC_Base_L_Foot", L.footX, 0, 0);

    moveBone("CC_Base_R_Thigh", R.thighX, R.thighY, R.thighZ);
    moveBone("CC_Base_R_Calf", R.calfX, 0, 0);
    moveBone("CC_Base_R_Foot", R.footX, 0, 0);

    // =====================================================
    // HEAD
    // =====================================================
    moveBone("CC_Base_NeckTwist01", 0, -sway * 0.04, -beat * 0.02);
    moveBone("CC_Base_Head", 0, -sway * 0.05, -beat * 0.03);

    // =====================================================
    // WHOLE BODY SHIFT
    // =====================================================
    const targetX = beat * 0.05 * amp;
    const targetY = BASE_Y - bounce * 0.04 * amp;
    scene.position.x = MathUtils.damp(scene.position.x, targetX, SMOOTH, dt);
    scene.position.y = MathUtils.damp(scene.position.y, targetY, SMOOTH, dt);
  });

  // Scale adjusted to 2.15 so her head & face stay fully in frame
  return <primitive object={scene} scale={2.15} position={[0, BASE_Y, 0]} />;
}

function DancingGirl({ isPlaying = true, speed = 1 }) {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 0.7, 5.6],
        fov: 45,
      }}
    >
      <color attach="background" args={["#0c0206"]} />
      <fog attach="fog" args={["#0c0206", 6, 15]} />

      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 5, 4]} intensity={1.6} color="#fff1e6" />

      <Environment preset="night" />

      <ClubStage isPlaying={isPlaying} speed={speed} />
      <GirlModel isPlaying={isPlaying} speed={speed} />

      {/* Target Y raised to 0.35 so the camera looks at her upper torso & face */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={3.2}
        maxDistance={8}
        target={[0, 0.35, 0]}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/girl_rigged_character.glb");

export default DancingGirl;