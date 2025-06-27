"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
import { useRef, useState } from "react"
import type * as THREE from "three"

// -------------------------------------------------
//  WebGL feature-test: returns false when the browser
//  cannot create a WebGL2 OR WebGL context.
// -------------------------------------------------
function webglAvailable() {
  if (typeof window === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      // older safari / iOS
      (canvas as any).getContext("experimental-webgl")
    )
  } catch {
    return false
  }
}

interface AvatarEmotion {
  type: "neutral" | "excited" | "concerned" | "analytical" | "celebrating"
  intensity: number
  message?: string
}

interface Avatar3DProps {
  emotion: AvatarEmotion
}

function AvatarHead({ emotion }: { emotion: AvatarEmotion }) {
  const headRef = useRef<THREE.Group>(null)
  const eyesRef = useRef<THREE.Group>(null)
  const [time, setTime] = useState(0)

  useFrame((state) => {
    if (!headRef.current || !eyesRef.current) return

    const t = state.clock.getElapsedTime()
    setTime(t)

    // Breathing animation
    headRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.02)

    // Eye movement and blinking
    const blinkCycle = Math.sin(t * 0.5) > 0.95 ? 0.1 : 1
    eyesRef.current.scale.y = blinkCycle

    // Emotional expressions
    switch (emotion.type) {
      case "excited":
        headRef.current.rotation.z = Math.sin(t * 3) * 0.05
        eyesRef.current.scale.setScalar(1.2 * blinkCycle)
        break
      case "concerned":
        headRef.current.rotation.x = -0.1
        eyesRef.current.position.y = -0.05
        break
      case "analytical":
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.1
        break
      case "celebrating":
        headRef.current.rotation.z = Math.sin(t * 5) * 0.1
        headRef.current.position.y = Math.sin(t * 4) * 0.05
        break
      default:
        headRef.current.rotation.set(0, Math.sin(t * 0.3) * 0.05, 0)
    }
  })

  const getEmotionColor = () => {
    switch (emotion.type) {
      case "excited":
        return "#10b981"
      case "concerned":
        return "#f59e0b"
      case "analytical":
        return "#8b5cf6"
      case "celebrating":
        return "#06b6d4"
      default:
        return "#3b82f6"
    }
  }

  return (
    <group ref={headRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.1} roughness={0.3} transparent opacity={0.9} />
      </mesh>

      {/* Eyes */}
      <group ref={eyesRef} position={[0, 0.2, 0.8]}>
        <mesh position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={getEmotionColor()} emissive={getEmotionColor()} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={getEmotionColor()} emissive={getEmotionColor()} emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Mouth - changes based on emotion */}
      <mesh
        position={[0, -0.3, 0.7]}
        rotation={[
          0,
          0,
          emotion.type === "excited" || emotion.type === "celebrating" ? 0.2 : emotion.type === "concerned" ? -0.2 : 0,
        ]}
      >
        <torusGeometry args={[0.2, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Hair/Head decoration */}
      <mesh position={[0, 0.8, 0]} rotation={[0, time * 0.1, 0]}>
        <coneGeometry args={[0.8, 0.5, 8]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.7} wireframe />
      </mesh>

      {/* Holographic aura */}
      <mesh position={[0, 0, 0]} scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={getEmotionColor()} transparent opacity={0.1} wireframe />
      </mesh>
    </group>
  )
}

function ParticleField({ emotion }: { emotion: AvatarEmotion }) {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!particlesRef.current) return

    const time = state.clock.getElapsedTime()
    particlesRef.current.rotation.y = time * 0.1

    // Adjust particle intensity based on emotion
    const intensity = emotion.intensity * (emotion.type === "excited" || emotion.type === "celebrating" ? 2 : 1)
    particlesRef.current.scale.setScalar(intensity)
  })

  const particleCount = 100
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#3b82f6" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

export function Avatar3D({ emotion }: Avatar3DProps) {
  // --- NEW: early-out when WebGL is not available -------------
  if (!webglAvailable()) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900/60 rounded-lg">
        {/* static icon or emoji as lightweight “avatar” */}
        <span className="text-5xl">🤖</span>
        <p className="mt-2 text-xs text-slate-400">3D view unavailable – WebGL disabled. Running fallback mode.</p>
      </div>
    )
  }
  // ------------------------------------------------------------

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900/50 to-black/50 rounded-lg overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[1, 1]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />

        <AvatarHead emotion={emotion} />
        <ParticleField emotion={emotion} />

        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />

        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
      </Canvas>

      {/* Emotion indicator */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wider">{emotion.type}</div>
          <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
            <div
              className="bg-blue-400 h-1 rounded-full transition-all duration-300"
              style={{ width: `${emotion.intensity * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
