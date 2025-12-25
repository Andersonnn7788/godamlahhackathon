'use client';

import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { PersonalizedGreeting } from '@/types/greeting';
import { PredictionResult } from '@/types/prediction';
import { Badge } from '@/components/ui/Badge';
import { Brain, X, Sparkles, ChevronRight } from 'lucide-react';
import * as THREE from 'three';
import { clone as cloneGltf } from 'three/examples/jsm/utils/SkeletonUtils';

// Avatar Model Component using GLB file with sign language animations
function AvatarModel({ isWaving, isSigning }: { isWaving: boolean; isSigning: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/avatars/694d1f768f9c70cbc94f4921.glb');

  // Clone the scene to avoid modifying the cached model
  const clonedScene = useMemo(() => {
    try {
      return cloneGltf(scene);
    } catch (err) {
      console.error('SkeletonUtils.clone failed, falling back to scene.clone()', err);
      return scene.clone();
    }
  }, [scene]);
  const bones = useMemo(() => {
    const found: Record<string, THREE.Object3D | null> = {
      leftHand: null,
      rightHand: null,
      leftForearm: null,
      rightForearm: null,
      leftUpperArm: null,
      rightUpperArm: null,
      leftShoulder: null,
      rightShoulder: null,
      leftClavicle: null,
      rightClavicle: null,
    };
    const fingerBones: { left: THREE.Object3D[]; right: THREE.Object3D[] } = {
      left: [],
      right: [],
    };

    clonedScene.traverse((obj) => {
      if (!(obj as any).isBone) return;

      const n = obj.name.toLowerCase();

      if (!found.leftHand && n.includes('lefthand')) found.leftHand = obj;
      if (!found.rightHand && n.includes('righthand')) found.rightHand = obj;

      if (!found.leftForearm && (n.includes('leftforearm') || n.includes('leftlowerarm')))
        found.leftForearm = obj;
      if (!found.rightForearm && (n.includes('rightforearm') || n.includes('rightlowerarm')))
        found.rightForearm = obj;

      if (!found.leftUpperArm && (n.includes('leftarm') || n.includes('leftupperarm')))
        found.leftUpperArm = obj;
      if (!found.rightUpperArm && (n.includes('rightarm') || n.includes('rightupperarm')))
        found.rightUpperArm = obj;

      if (!found.leftShoulder && n.includes('leftshoulder')) found.leftShoulder = obj;
      if (!found.rightShoulder && n.includes('rightshoulder')) found.rightShoulder = obj;

      if (!found.leftClavicle && (n.includes('leftclavicle') || n.includes('leftcollar')))
        found.leftClavicle = obj;
      if (!found.rightClavicle && (n.includes('rightclavicle') || n.includes('rightcollar')))
        found.rightClavicle = obj;

      const isLeft = n.includes('left') || n.startsWith('l_') || n.startsWith('l ');
      const isRight = n.includes('right') || n.startsWith('r_') || n.startsWith('r ');
      const fingerKeyword =
        n.includes('thumb') ||
        n.includes('index') ||
        n.includes('middle') ||
        n.includes('ring') ||
        n.includes('pinky') ||
        n.includes('little');
      if (fingerKeyword) {
        if (isLeft) fingerBones.left.push(obj);
        else if (isRight) fingerBones.right.push(obj);
      }
    });

    return { ...found, fingerBones };
  }, [clonedScene]);

  const {
    leftHand,
    rightHand,
    leftForearm,
    rightForearm,
    leftUpperArm,
    rightUpperArm,
    leftShoulder,
    rightShoulder,
    leftClavicle,
    rightClavicle,
    fingerBones,
  } = bones;

  useEffect(() => {
    console.log('Scene children:', clonedScene);
    console.log('LeftHand found?', !!leftHand);
    console.log('RightHand found?', !!rightHand);
    console.log('LeftForearm found?', !!leftForearm);
    console.log('RightForearm found?', !!rightForearm);
  }, [clonedScene, leftHand, rightHand, leftForearm, rightForearm]);

  // Sign language animation - animate hands/arms
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();
    const t = time;
    const baseY = -0.4;
    const baseX = 0;
    const baseYaw = 0.15;
    const baseScale = 0.75;

    // keep position/orientation stable so torso/head stay still while signing
    group.position.set(baseX, baseY, 0);
    group.scale.setScalar(baseScale);
    group.rotation.set(0, baseYaw, 0);

    // Sign language hand gestures when greeting is active
    if (isSigning) {
      const speed = 3.0;
      const leftPhase = t * speed;
      const rightPhase = t * speed + 1.2;

      // ---- BASE SIGNING POSE (hands chest-level, elbows ~90°) ----
      if (leftShoulder) leftShoulder.rotation.set(0.35, 0.1, 0.15);
      if (rightShoulder) rightShoulder.rotation.set(0.35, -0.1, -0.15);

      if (leftClavicle) leftClavicle.rotation.set(0.1, 0.02, 0.08);
      if (rightClavicle) rightClavicle.rotation.set(0.1, -0.02, -0.08);

      if (leftUpperArm) {
        leftUpperArm.rotation.set(-0.55, 0.55, 0.08);
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.set(-0.55, -0.55, -0.08);
      }

      if (leftForearm) {
        leftForearm.rotation.set(-1.0, 0.05, 0.0);
      }
      if (rightForearm) {
        rightForearm.rotation.set(-1.0, -0.05, 0.0);
      }

      if (leftHand) {
        leftHand.rotation.set(-0.05, 0.15, 0.0);
      }
      if (rightHand) {
        rightHand.rotation.set(-0.05, -0.15, 0.0);
      }

      // ---- Small signing motion overlays (keep subtle) ----
      if (leftForearm) leftForearm.rotation.x += Math.sin(t * speed) * 0.05;
      if (rightForearm) rightForearm.rotation.x += Math.sin(rightPhase) * 0.05;

      if (leftHand) {
        leftHand.rotation.y += Math.sin(t * speed * 1.4) * 0.06;
        leftHand.rotation.x += Math.sin(t * speed * 1.8) * 0.06;
      }
      if (rightHand) {
        rightHand.rotation.y += Math.sin(t * speed * 1.4 + 1.2) * -0.06;
        rightHand.rotation.x += Math.sin(t * speed * 1.8 + 1.2) * 0.06;
      }

      // Gentle finger curl if finger bones exist
      if (fingerBones.left.length) {
        fingerBones.left.forEach((bone, i) => {
          bone.rotation.x = -0.25 + Math.sin(leftPhase * 1.2 + i * 0.15) * 0.25;
        });
      }
      if (fingerBones.right.length) {
        fingerBones.right.forEach((bone, i) => {
          bone.rotation.x = -0.25 + Math.sin(rightPhase * 1.2 + i * 0.15) * 0.25;
        });
      }
    } else if (isWaving) {
      // Simple waving animation when first opening
      group.rotation.set(0, baseYaw, Math.sin(time * 3) * 0.12);
    }
  });

  return (
    <group ref={groupRef} scale={0.75} position={[0, -0.4, 0]} rotation={[0, 0.2, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/avatars/694d1f768f9c70cbc94f4921.glb');

interface ThreeJsAvatarWidgetProps {
  greeting: PersonalizedGreeting | null;
  prediction: PredictionResult | null;
  isLoading: boolean;
  onQuickAction?: (action: string) => void;
}

export function ThreeJsAvatarWidget({
  greeting,
  prediction,
  isLoading,
  onQuickAction,
}: ThreeJsAvatarWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Start with a quick wave, then move into a continuous signing loop
  useEffect(() => {
    const waveTimer = setTimeout(() => setIsWaving(true), 400);
    const signTimer = setTimeout(() => {
      setIsWaving(false);
      setIsSigning(true);
    }, 2000);

    return () => {
      clearTimeout(waveTimer);
      clearTimeout(signTimer);
    };
  }, []);

  // Auto-open when greeting arrives and keep signing active
  useEffect(() => {
    if (greeting && !isOpen) {
      setIsOpen(true);
    }
    if (greeting) {
      setIsSigning(true);
    }
  }, [greeting, isOpen]);

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Chat Bubble - Appears to the left of avatar */}
      {isOpen && (
        <div className="pointer-events-auto w-[380px] rounded-3xl bg-white/95 dark:bg-gray-900/90 shadow-2xl border border-cyan-100/70 dark:border-cyan-900/50 backdrop-blur-xl p-4 relative overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-16 bg-gradient-to-r from-cyan-400/30 via-blue-500/20 to-transparent blur-3xl" aria-hidden />

          <div className="relative z-10 flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-200">
                SmartSign Assistant
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Live BIM signing - conversational
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/30 dark:hover:bg-gray-800/60 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            </button>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow-md">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-md bg-cyan-50 dark:bg-cyan-900/40 border border-cyan-100 dark:border-cyan-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 shadow-sm">
                <p>{greeting?.greeting_text ?? 'Welcome! Checking your passport status...'}</p>
                {greeting?.is_personalized && (
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    <span>Dipersonalisasi untuk anda</span>
                  </div>
                )}
              </div>
            </div>

            {prediction && (
              <div className="flex items-start gap-3 ml-8">
                <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-3 py-2 text-xs text-purple-800 dark:text-purple-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4" />
                    <span className="font-semibold">AI Prediction</span>
                    <Badge variant="purple" className="text-[10px] h-5">
                      {Math.round(prediction.confidence * 100)}%
                    </Badge>
                  </div>
                  <p>{prediction.predicted_intent}</p>
                </div>
              </div>
            )}

            {greeting?.quick_actions && greeting.quick_actions.length > 0 && (
              <div className="ml-11">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Suggested replies</p>
                <div className="flex flex-wrap gap-2">
                  {greeting.quick_actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/40 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2"
                    >
                      {action}
                      <ChevronRight className="h-4 w-4 text-cyan-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3D Avatar Widget - no card, transparent background */}
      <div
        className="relative w-64 h-80 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Canvas
          camera={{ position: [0, 1.0, 2.3], fov: 32 }}
          gl={{ alpha: true }}
        >
          <color attach="background" args={['transparent']} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 6, 4]} intensity={1.35} />
          <directionalLight position={[-5, 4, -3]} intensity={0.6} />
          <pointLight position={[0, 6, 1]} intensity={0.85} />

          <Suspense fallback={null}>
            <AvatarModel isWaving={isWaving} isSigning={isSigning} />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            target={[0, 0.6, 0]}
          />
        </Canvas>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-full p-3 shadow">
              <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
