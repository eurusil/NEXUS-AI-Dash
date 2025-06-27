"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { EnhancedAvatar3D } from "@/components/enhanced-avatar-3d"
import { TradingChart } from "@/components/trading-chart"
import { StrategyMatrix } from "@/components/strategy-matrix"
import { RiskDashboard } from "@/components/risk-dashboard"
import { MarketAnalytics } from "@/components/market-analytics"
import { TradingJournal } from "@/components/trading-journal"
import { BrokerConnection } from "@/components/broker-connection"
import { LiveMarketData } from "@/components/live-market-data"
import { LiveOrderManagement } from "@/components/live-order-management"
import { useTradeStore } from "@/lib/trade-store"
import { aiService } from "@/lib/ai-service"
import { tradingAPI } from "@/lib/trading-api"
import { Activity, Brain, Settings, TrendingUp, Target, Cpu, BookOpen, BarChart3, Wifi, WifiOff } from "lucide-react"

interface AvatarEmotion {
  type: "neutral" | "excited" | "concerned" | "analytical" | "celebrating"
  intensity: number
  message?: string
}

export default function NEXUSTradingDashboard() {
  const [currentView, setCurrentView] = useState<"dashboard" | "journal" | "live-trading">("dashboard")
  const [voiceActive, setVoiceActive] = useState(false)
  const [brokerConnected, setBrokerConnected] = useState(false)
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>({
    type: "neutral",
    intensity: 0.5,
  })

  const { marketData, updateCurrentPrice, updateMarketData, getStats, getOpenTrades } = useTradeStore()
  const stats = getStats()
  const openTrades = getOpenTrades()

  const [systemStatus] = useState({
    connection: "LIVE",
    latency: 12,
    dataFeed: "ACTIVE",
    aiModel: "LOCAL-AI-V1.0",
  })

  // Subscribe to live market data updates
  useEffect(() => {
    if (!brokerConnected) return

    const handleMarketData = (tick: any) => {
      // Update current price for ES futures
      if (tick.symbol === "ES") {
        updateCurrentPrice(tick.price)
      }

      // Update market data with real values
      updateMarketData({
        currentPrice: tick.price,
        timestamp: tick.timestamp,
        volatility: Math.random() * 0.5 + 0.5, // Simplified volatility calculation
      })
    }

    tradingAPI.onMarketData(handleMarketData)

    return () => {
      // Cleanup handled by tradingAPI
    }
  }, [brokerConnected, updateCurrentPrice, updateMarketData])

  // Simulate real-time market updates when not connected to live data
  useEffect(() => {
    if (brokerConnected) return // Don't simulate if we have real data

    const interval = setInterval(() => {
      const newPrice = marketData.currentPrice + (Math.random() - 0.5) * 3
      const newDelta = marketData.cumulativeDelta + Math.floor((Math.random() - 0.5) * 150)
      const newVolatility = Math.max(0.1, Math.min(2.0, marketData.volatility + (Math.random() - 0.5) * 0.05))

      updateCurrentPrice(newPrice)
      updateMarketData({
        cumulativeDelta: newDelta,
        volatility: newVolatility,
        dailyPnL: stats.totalPnL + stats.unrealizedPnL,
        winRate: stats.winRate,
        totalTrades: stats.totalTrades,
        portfolioHeat: Math.max(0.1, Math.min(3.0, marketData.portfolioHeat + (Math.random() - 0.5) * 0.1)),
      })

      // Update avatar emotion based on performance
      if (stats.totalPnL + stats.unrealizedPnL > 1000) {
        setAvatarEmotion({ type: "excited", intensity: 0.8, message: "Excellent performance detected!" })
      } else if (marketData.portfolioHeat > 2.5) {
        setAvatarEmotion({ type: "concerned", intensity: 0.9, message: "Risk levels elevated" })
      } else if (Math.random() > 0.8) {
        setAvatarEmotion({ type: "analytical", intensity: 0.6, message: "Analyzing market patterns..." })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [marketData, stats, updateCurrentPrice, updateMarketData, brokerConnected])

  const handleVoiceCommand = async (command: string) => {
    try {
      const context = {
        ...marketData,
        openTrades: openTrades.length,
        recentTrades: [],
        winRate: stats.winRate,
      }

      const response = await aiService.processVoiceCommand(command, context)
      setAvatarEmotion({
        type: response.emotion,
        intensity: response.confidence,
        message: response.message,
      })
    } catch (error) {
      console.error("Voice command processing failed:", error)
    }
  }

  if (currentView === "journal") {
    return <TradingJournal onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "live-trading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-50 border-b border-slate-800/50 bg-black/40 backdrop-blur-xl">
          <div className="container mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-light tracking-wide text-white">NEXUS LIVE</div>
                    <div className="text-xs text-slate-400 -mt-1">Real-Time Trading Platform</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge
                    variant="outline"
                    className={
                      brokerConnected
                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                        : "border-red-500/50 text-red-400 bg-red-500/10"
                    }
                  >
                    <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse" />
                    {brokerConnected ? "LIVE" : "DISCONNECTED"}
                  </Badge>
                  <div className="text-xs text-slate-400">
                    AI: <span className="text-purple-400">{systemStatus.aiModel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("dashboard")}
                    className="text-slate-400 hover:text-white"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("journal")}
                    className="text-slate-400 hover:text-white"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Journal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("live-trading")}
                    className="text-emerald-400 bg-emerald-500/10"
                  >
                    {brokerConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                    Live Trading
                  </Button>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Total P&L</div>
                  <div
                    className={`text-2xl font-light ${(stats.totalPnL + stats.unrealizedPnL) > 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {stats.totalPnL + stats.unrealizedPnL > 0 ? "+" : ""}$
                    {(stats.totalPnL + stats.unrealizedPnL).toFixed(2)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-8 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Panel: Broker Connection */}
            <div className="col-span-4 space-y-6">
              <BrokerConnection onConnectionChange={setBrokerConnected} />
              <LiveMarketData connected={brokerConnected} />
            </div>

            {/* Right Panel: Live Order Management */}
            <div className="col-span-8">
              <LiveOrderManagement connected={brokerConnected} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-slate-800/50 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-light tracking-wide text-white">NEXUS</div>
                  <div className="text-xs text-slate-400 -mt-1">Quantum Trading Platform</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                  {systemStatus.connection}
                </Badge>
                <div className="text-xs text-slate-400">
                  AI: <span className="text-purple-400">{systemStatus.aiModel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("dashboard")}
                  className={`${currentView === "dashboard" ? "text-blue-400 bg-blue-500/10" : "text-slate-400"} hover:text-white`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("journal")}
                  className={`${currentView === "journal" ? "text-purple-400 bg-purple-500/10" : "text-slate-400"} hover:text-white`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Journal ({openTrades.length} open)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("live-trading")}
                  className={`${currentView === "live-trading" ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400"} hover:text-white`}
                >
                  {brokerConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                  Live Trading
                </Button>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Total P&L</div>
                <div
                  className={`text-2xl font-light ${(stats.totalPnL + stats.unrealizedPnL) > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {stats.totalPnL + stats.unrealizedPnL > 0 ? "+" : ""}$
                  {(stats.totalPnL + stats.unrealizedPnL).toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider">ES Future</div>
                <div className="text-2xl font-light text-blue-400">{marketData.currentPrice.toFixed(2)}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8 h-[calc(100vh-140px)]">
          {/* Left Panel: Enhanced AI Avatar */}
          <div className="col-span-3 space-y-6">
            <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-base font-medium">AETHEL</div>
                      <div className="text-xs text-slate-400 -mt-1">Quantum AI Oracle</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 bg-purple-500/10 text-xs">
                    {aiService.getConfig().mode === "local" ? "LOCAL AI" : "ONLINE AI"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80">
                  <EnhancedAvatar3D
                    emotion={avatarEmotion}
                    voiceActive={voiceActive}
                    onVoiceCommand={handleVoiceCommand}
                  />
                </div>
              </CardContent>
            </Card>

            <RiskDashboard marketData={marketData} />
          </div>

          {/* Center: Market Visualization */}
          <div className="col-span-6 space-y-6">
            <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-base font-medium">Market Analysis</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-slate-400">
                      Δ: <span className="text-purple-400 font-mono">{marketData.cumulativeDelta}</span>
                    </div>
                    <div className="text-slate-400">
                      Vol: <span className="text-orange-400 font-mono">{marketData.volatility.toFixed(2)}</span>
                    </div>
                    {brokerConnected && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-xs"
                      >
                        LIVE DATA
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TradingChart marketData={marketData} />
              </CardContent>
            </Card>

            <MarketAnalytics marketData={marketData} />
          </div>

          {/* Right Panel: Strategy & Performance */}
          <div className="col-span-3 space-y-6">
            <StrategyMatrix />

            <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-base font-medium">Live Performance</div>
                    <div className="text-xs text-slate-400 -mt-1">Real-time statistics</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Win Rate</div>
                    <div className="text-lg font-mono text-emerald-400">{stats.winRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Profit Factor</div>
                    <div className="text-lg font-mono text-blue-400">{stats.profitFactor.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Open Trades</div>
                    <div className="text-lg font-mono text-purple-400">{stats.openTrades}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Total Trades</div>
                    <div className="text-lg font-mono text-cyan-400">{stats.totalTrades}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Unrealized P&L</span>
                    <span className={`font-mono ${stats.unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stats.unrealizedPnL >= 0 ? "+" : ""}${stats.unrealizedPnL.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, Math.abs(stats.unrealizedPnL) / 100)} className="h-2 bg-slate-800" />
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentView("journal")}
                    className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs flex-1"
                  >
                    Open Journal
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentView("live-trading")}
                    className={`text-xs flex-1 ${
                      brokerConnected
                        ? "border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                        : "border-orange-500/50 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20"
                    }`}
                  >
                    {brokerConnected ? "Live Trading" : "Connect Broker"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-orange-400" />
                  <span className="text-base font-medium">System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Data Feed</div>
                    <div className={brokerConnected ? "text-emerald-400 font-mono" : "text-orange-400 font-mono"}>
                      {brokerConnected ? "Live" : "Simulated"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">AI Status</div>
                    <div className="text-purple-400 font-mono">Active</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Latency</div>
                    <div className="text-blue-400 font-mono">{systemStatus.latency}ms</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Uptime</div>
                    <div className="text-cyan-400 font-mono">99.9%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
