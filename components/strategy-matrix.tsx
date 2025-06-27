"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, TrendingUp, AlertTriangle, CheckCircle, Pause } from "lucide-react"

interface Strategy {
  id: string
  name: string
  enabled: boolean
  signals: number
  winRate: number
  pnl: number
  confidence: number
  status: "active" | "idle" | "warning" | "optimal"
  description: string
}

export function StrategyMatrix() {
  const [strategies] = useState<Strategy[]>([
    {
      id: "liquidity_absorption",
      name: "Liquidity Absorption",
      enabled: true,
      signals: 18,
      winRate: 84.2,
      pnl: 1247.83,
      confidence: 92,
      status: "optimal",
      description: "Detecting large order absorption patterns",
    },
    {
      id: "iceberg_detection",
      name: "Iceberg Detection",
      enabled: true,
      signals: 12,
      winRate: 78.5,
      pnl: 687.45,
      confidence: 87,
      status: "active",
      description: "Hidden order identification system",
    },
    {
      id: "delta_divergence",
      name: "Delta Divergence",
      enabled: true,
      signals: 24,
      winRate: 71.3,
      pnl: 523.67,
      confidence: 79,
      status: "active",
      description: "Price-delta relationship analysis",
    },
    {
      id: "volume_imbalance",
      name: "Volume Imbalance",
      enabled: false,
      signals: 0,
      winRate: 0,
      pnl: 0,
      confidence: 0,
      status: "idle",
      description: "Bid-ask volume disparity detection",
    },
    {
      id: "hvn_rejection",
      name: "HVN Rejection",
      enabled: true,
      signals: 8,
      winRate: 89.7,
      pnl: 445.23,
      confidence: 94,
      status: "optimal",
      description: "High volume node rejection patterns",
    },
    {
      id: "momentum_breakout",
      name: "Momentum Breakout",
      enabled: true,
      signals: 15,
      winRate: 65.4,
      pnl: 234.56,
      confidence: 72,
      status: "warning",
      description: "Momentum-based breakout detection",
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case "active":
        return <TrendingUp className="w-4 h-4 text-blue-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      default:
        return <Pause className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "border-emerald-500/50 bg-emerald-500/10"
      case "active":
        return "border-blue-500/50 bg-blue-500/10"
      case "warning":
        return "border-amber-500/50 bg-amber-500/10"
      default:
        return "border-slate-500/50 bg-slate-500/10"
    }
  }

  return (
    <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-base font-medium">Strategy Matrix</div>
            <div className="text-xs text-slate-400 -mt-1">Neural trading algorithms</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
              strategy.enabled ? getStatusColor(strategy.status) : "border-slate-600/30 bg-slate-800/20"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(strategy.status)}
                <div>
                  <div className="text-sm font-medium text-white">{strategy.name}</div>
                  <div className="text-xs text-slate-400">{strategy.description}</div>
                </div>
              </div>
              <Badge variant="outline" className={`text-xs ${getStatusColor(strategy.status)} border-0`}>
                {strategy.status.toUpperCase()}
              </Badge>
            </div>

            {strategy.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400">Signals</div>
                    <div className="font-mono text-blue-400 font-bold">{strategy.signals}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Win Rate</div>
                    <div
                      className={`font-mono font-bold ${
                        strategy.winRate > 80
                          ? "text-emerald-400"
                          : strategy.winRate > 70
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {strategy.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">P&L</div>
                    <div className={`font-mono font-bold ${strategy.pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${strategy.pnl.toFixed(0)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Confidence</span>
                    <span className="text-purple-400 font-mono">{strategy.confidence}%</span>
                  </div>
                  <Progress value={strategy.confidence} className="h-1.5 bg-slate-800" />
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
