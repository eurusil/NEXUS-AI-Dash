"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, Text } from "@react-three/drei"
import { useRef, useState, useEffect } from "react"
import { useTradeStore } from "@/lib/trade-store"
import { aiService } from "@/lib/ai-service"
import type * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Volume2, Send } from "lucide-react"
import { AIConfigPanel } from "./ai-config-panel"

// WebGL feature-test
function webglAvailable() {
  if (typeof window === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
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

interface EnhancedAvatar3DProps {
  emotion: AvatarEmotion
  voiceActive: boolean
  onVoiceCommand?: (command: string) => void
}

function AvatarHead({ emotion, speaking }: { emotion: AvatarEmotion; speaking: boolean }) {
  const headRef = useRef<THREE.Group>(null)
  const eyesRef = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const [time, setTime] = useState(0)

  useFrame((state) => {
    if (!headRef.current || !eyesRef.current || !mouthRef.current) return

    const t = state.clock.getElapsedTime()
    setTime(t)

    // Breathing animation
    const breathingScale = 1 + Math.sin(t * 2) * 0.02
    headRef.current.scale.setScalar(breathingScale)

    // Eye movement and blinking
    const blinkCycle = Math.sin(t * 0.5) > 0.95 ? 0.1 : 1
    eyesRef.current.scale.y = blinkCycle

    // Speaking animation
    if (speaking) {
      const speakingScale = 1 + Math.sin(t * 8) * 0.3
      mouthRef.current.scale.x = speakingScale
    }

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

      {/* Mouth */}
      <mesh
        ref={mouthRef}
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

      {/* Status text */}
      <Text position={[0, -2, 0]} fontSize={0.2} color={getEmotionColor()} anchorX="center" anchorY="middle">
        {emotion.type.toUpperCase()}
      </Text>
    </group>
  )
}

function ParticleField({ emotion }: { emotion: AvatarEmotion }) {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!particlesRef.current) return

    const time = state.clock.getElapsedTime()
    particlesRef.current.rotation.y = time * 0.1

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

export function EnhancedAvatar3D({ emotion, voiceActive, onVoiceCommand }: EnhancedAvatar3DProps) {
  const [speaking, setSpeaking] = useState(false)
  const [aiResponse, setAiResponse] = useState<string>("")
  const [commandInput, setCommandInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<Array<{ command: string; response: string; timestamp: Date }>>(
    [],
  )
  const { marketData, getStats, getOpenTrades, getRecentTrades } = useTradeStore()
  const [avatarEmotion, setAvatarEmotion] = useState(emotion)
  const [voiceActiveState, setVoiceActive] = useState(voiceActive)

  const handleCommand = async (command: string) => {
    if (!command.trim()) return

    setSpeaking(true)
    setAiResponse("Processing your request...")

    try {
      const stats = getStats()
      const openTrades = getOpenTrades()
      const recentTrades = getRecentTrades(10)

      const context = {
        ...marketData,
        openTrades: openTrades.length,
        recentTrades,
        winRate: stats.winRate,
        command: command.toLowerCase(),
      }

      // Generate contextual responses based on command
      let response = ""

      if (command.toLowerCase().includes("performance") || command.toLowerCase().includes("how am i doing")) {
        response = `Your current performance shows a ${stats.winRate.toFixed(1)}% win rate with ${stats.totalTrades} total trades. ${stats.totalPnL >= 0 ? "You're in profit!" : "Focus on risk management."}`
        setAvatarEmotion({ ...emotion, type: stats.totalPnL >= 0 ? "excited" : "concerned", message: response })
      } else if (command.toLowerCase().includes("risk")) {
        response = `Current risk exposure: ${openTrades.length} open positions. Your risk-reward ratio is balanced. Consider position sizing adjustments.`
        setAvatarEmotion({ ...emotion, type: "analytical", message: response })
      } else if (command.toLowerCase().includes("market")) {
        response = `Market analysis: Current trend shows ${marketData.trend || "mixed"} momentum. Volume is ${marketData.volume > 1000000 ? "high" : "moderate"}. Watch for key support/resistance levels.`
        setAvatarEmotion({ ...emotion, type: "analytical", message: response })
      } else if (command.toLowerCase().includes("positions") || command.toLowerCase().includes("trades")) {
        response = `You have ${openTrades.length} open positions. Recent trades show ${recentTrades.length > 0 ? "active" : "low"} trading activity. ${recentTrades.length > 0 ? "Last trade: " + (recentTrades[0]?.type || "N/A") : ""}`
        setAvatarEmotion({ ...emotion, type: "neutral", message: response })
      } else {
        // Use AI service for complex queries
        const aiResult = await aiService.analyzeMarket(context)
        response = aiResult.message
        setAvatarEmotion({ ...emotion, type: "analytical", message: response })
      }

      setAiResponse(response)

      // Add to command history
      setCommandHistory((prev) => [
        {
          command,
          response,
          timestamp: new Date(),
        },
        ...prev.slice(0, 4),
      ]) // Keep last 5 commands

      if (onVoiceCommand) {
        onVoiceCommand(command)
      }
    } catch (error) {
      console.error("Command processing failed:", error)
      const errorResponse = "I'm having trouble processing that request. Please try again."
      setAiResponse(errorResponse)
      setAvatarEmotion({ ...emotion, type: "concerned", message: errorResponse })
    }

    setTimeout(() => setSpeaking(false), 3000)
  }

  // Auto-analyze market conditions periodically
  useEffect(() => {
    const analyzeMarket = async () => {
      const stats = getStats()
      const openTrades = getOpenTrades()
      const recentTrades = getRecentTrades(10)

      const context = {
        ...marketData,
        openTrades: openTrades.length,
        recentTrades,
        winRate: stats.winRate,
      }

      try {
        const response = await aiService.analyzeMarket(context)
        setAiResponse(response.message)

        // Simulate speaking
        setSpeaking(true)
        setTimeout(() => setSpeaking(false), 2000)
      } catch (error) {
        console.error("AI analysis failed:", error)
      }
    }

    // Analyze every 30 seconds
    const interval = setInterval(analyzeMarket, 30000)
    analyzeMarket() // Initial analysis

    return () => clearInterval(interval)
  }, [marketData, getStats, getOpenTrades, getRecentTrades])

  if (!webglAvailable()) {
    return (
      <div className="flex flex-col w-full h-full bg-slate-900/60 rounded-lg">
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <span className="text-5xl mb-4">🤖</span>
          <div className="text-center">
            <div className="text-lg font-medium text-white mb-2">AETHEL</div>
            <div className="text-sm text-slate-400 mb-4">Quantum AI Oracle</div>
            <div className="text-xs text-slate-500">3D view unavailable – WebGL disabled</div>
          </div>

          {aiResponse && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg max-w-xs text-center">
              <div className="text-xs text-slate-300">{aiResponse}</div>
            </div>
          )}
        </div>

        {/* Command Interface for non-WebGL fallback */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="mb-4">
            <div className="flex space-x-2">
              <Input
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Ask AETHEL anything... (e.g., 'How is my performance today?')"
                className="bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCommand(commandInput)
                    setCommandInput("")
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  handleCommand(commandInput)
                  setCommandInput("")
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Try: "Analyze my trades", "What's my risk level?", "Market outlook"
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900/50 to-black/50 rounded-lg overflow-hidden relative flex flex-col">
      {/* 3D Avatar Canvas */}
      <div className="flex-1 relative">
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

          <AvatarHead emotion={avatarEmotion} speaking={speaking} />
          <ParticleField emotion={avatarEmotion} />

          <Environment preset="city" />
          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />

          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
        </Canvas>

        {/* AI Response Overlay */}
        {aiResponse && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50">
              <div className="text-xs text-slate-300">{aiResponse}</div>
            </div>
          </div>
        )}

        {/* Voice indicator */}
        {voiceActiveState && (
          <div className="absolute top-4 right-4">
            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-full p-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <AIConfigPanel />

        <div className="flex items-center justify-between mb-4 mt-4">
          <div className="text-sm text-slate-300">Voice Interface</div>
          <div className="flex space-x-2">
            <Button
              variant={voiceActiveState ? "default" : "outline"}
              size="sm"
              onClick={() => setVoiceActive(!voiceActiveState)}
              className={
                voiceActiveState
                  ? "bg-emerald-600 hover:bg-emerald-700 border-0"
                  : "border-slate-600 bg-transparent hover:bg-slate-800"
              }
            >
              {voiceActiveState ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" className="border-slate-600 bg-transparent hover:bg-slate-800">
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Command Input Area */}
        <div className="mb-4">
          <div className="flex space-x-2">
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Ask AETHEL anything... (e.g., 'How is my performance today?')"
              className="bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCommand(commandInput)
                  setCommandInput("")
                }
              }}
            />
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                handleCommand(commandInput)
                setCommandInput("")
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Try: "Analyze my trades", "What's my risk level?", "Market outlook"
          </div>
        </div>

        {/* Quick Command Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 bg-transparent hover:bg-slate-800 text-xs"
            onClick={() => handleCommand("How is my performance today?")}
          >
            Performance
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 bg-transparent hover:bg-slate-800 text-xs"
            onClick={() => handleCommand("What's my current risk level?")}
          >
            Risk Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 bg-transparent hover:bg-slate-800 text-xs"
            onClick={() => handleCommand("Analyze market conditions")}
          >
            Market Analysis
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 bg-transparent hover:bg-slate-800 text-xs"
            onClick={() => handleCommand("Show me my open positions")}
          >
            Positions
          </Button>
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="max-h-32 overflow-y-auto">
            <div className="text-xs text-slate-400 mb-2">Recent Commands:</div>
            {commandHistory.map((item, index) => (
              <div key={index} className="mb-2 p-2 bg-slate-800/30 rounded text-xs">
                <div className="text-slate-300 font-medium">Q: {item.command}</div>
                <div className="text-slate-400 mt-1">A: {item.response}</div>
              </div>
            ))}
          </div>
        )}

        {avatarEmotion.message && (
          <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-700/50 mt-4">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>"{avatarEmotion.message}"</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
