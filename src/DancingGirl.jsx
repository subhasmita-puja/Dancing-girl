import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { MathUtils } from "three";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => x * x * (3 - 2 * x); // smoothstep

function GirlModel() {
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    time.current += dt;
    const t = time.current;

    // Smoothing: bones chase their target instead of snapping (removes jitter)
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

      bone.rotation.x = MathUtils.damp(bone.rotation.x, original.x + x, SMOOTH, dt);
      bone.rotation.y = MathUtils.damp(bone.rotation.y, original.y + y, SMOOTH, dt);
      bone.rotation.z = MathUtils.damp(bone.rotation.z, original.z + z, SMOOTH, dt);
    };

    // =====================================================
    // RHYTHM
    // =====================================================
    const phase = t * 4.5;
    const beat = Math.sin(phase); // side-to-side weight shift  (-1 .. 1)
    const fastBeat = Math.sin(phase * 2); // knee-bounce / hand flick
    const sway = Math.cos(phase); // 90° offset -> figure-eight hips

    // Weight distribution: 1 = all weight on that leg
    const weightL = 0.5 - 0.5 * beat; // weight on left when beat = -1
    const weightR = 1 - weightL;

    // Free leg lifts only while it is NOT carrying weight (smooth in/out)
    const liftL = ease(clamp01(beat));
    const liftR = ease(clamp01(-beat));

    // Knee bounce: knees soften on every beat (twice per cycle)
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
    // PELVIS: tilt (hip drop) + yaw twist -> figure-eight hip motion
    // =====================================================
    moveBone("CC_Base_Hip", 0, sway * 0.1, beat * 0.06);
    moveBone("CC_Base_Pelvis", 0, -sway * 0.12, -beat * 0.1);

    // =====================================================
    // SPINE: counter-rotate so the shoulders stay calm
    // =====================================================
    moveBone("CC_Base_Waist", 0, sway * 0.07, beat * 0.03);
    moveBone("CC_Base_Spine01", 0, sway * 0.06, beat * 0.04);
    moveBone("CC_Base_Spine02", 0, sway * 0.07, beat * 0.05);

    // =====================================================
    // LEGS
    // Supporting leg: slightly bent, knee softens with the bounce.
    // Free leg: thigh lifts, knee folds, foot trails, then re-plants.
    // Foot counter-rotates so the sole stays flat when planted.
    // =====================================================
    const leg = (weight, lift, side) => {
      const thighX = -lift * 0.42 - weight * 0.06 - bounce * weight * 0.07;
      const calfX = lift * 0.75 + weight * 0.1 + bounce * weight * 0.14;
      // keep the foot flat on the floor when carrying weight,
      // and let it point down a little when lifted
      const footX = -(thighX + calfX) * (0.4 + 0.6 * weight) + lift * 0.18;

      // stance width: standing leg pushes out a touch, free leg crosses in
      const thighZ = side * (0.04 + weight * 0.03 - lift * 0.05);
      // hip rotation follows the pelvis twist
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
    // HEAD: stays level, gently follows the beat
    // =====================================================
    moveBone("CC_Base_NeckTwist01", 0, -sway * 0.04, -beat * 0.02);
    moveBone("CC_Base_Head", 0, -sway * 0.05, -beat * 0.03);

    // =====================================================
    // WHOLE BODY: shift over the supporting leg + drop on knee bend
    // (this is what makes the step feel like it has weight)
    // =====================================================
    const targetX = beat * 0.05;
    const targetY = -1.5 - bounce * 0.04;
    scene.position.x = MathUtils.damp(scene.position.x, targetX, SMOOTH, dt);
    scene.position.y = MathUtils.damp(scene.position.y, targetY, SMOOTH, dt);
  });

  return <primitive object={scene} scale={2.5} position={[0, -1.5, 0]} />;
}

function DancingGirl() {
  return (
    <Canvas
      camera={{
        position: [0, 1.2, 5],
        fov: 45,
      }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 3]} intensity={2} />
      <Environment preset="studio" />
      <GirlModel />
      <OrbitControls />
    </Canvas>
  );
}

useGLTF.preload("/models/girl_rigged_character.glb");

export default DancingGirl;