"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, Activity } from "lucide-react"

interface MarketData {
  currentPrice: number
  dailyPnL: number
  portfolioHeat: number
  winRate: number
  totalTrades: number
  cumulativeDelta: number
  volatility: number
  timestamp: number
}

interface RiskDashboardProps {
  marketData: MarketData
}

export function RiskDashboard({ marketData }: RiskDashboardProps) {
  const maxDrawdown = 2.3
  const sharpeRatio = 1.87
  const sortinoRatio = 2.34

  const getRiskLevel = (heat: number) => {
    if (heat < 1.0) return { level: "LOW", color: "text-emerald-400", bg: "bg-emerald-500/20" }
    if (heat < 2.0) return { level: "MODERATE", color: "text-yellow-400", bg: "bg-yellow-500/20" }
    if (heat < 3.0) return { level: "HIGH", color: "text-orange-400", bg: "bg-orange-500/20" }
    return { level: "CRITICAL", color: "text-red-400", bg: "bg-red-500/20" }
  }

  const riskLevel = getRiskLevel(marketData.portfolioHeat)

  return (
    <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-base font-medium">Risk Management</div>
            <div className="text-xs text-slate-400 -mt-1">Portfolio protection system</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Indicator */}
        <div className={`p-4 rounded-lg ${riskLevel.bg} border border-slate-600/30`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`w-4 h-4 ${riskLevel.color}`} />
              <span className="text-sm font-medium">Risk Level</span>
            </div>
            <span className={`text-sm font-bold ${riskLevel.color}`}>{riskLevel.level}</span>
          </div>
          <div className="text-xs text-slate-400">Portfolio heat: {marketData.portfolioHeat.toFixed(1)}%</div>
        </div>

        {/* Portfolio Heat */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Portfolio Heat</span>
            <span className={riskLevel.color}>{marketData.portfolioHeat.toFixed(1)}%</span>
          </div>
          <Progress value={marketData.portfolioHeat * 20} className="h-2 bg-slate-800" />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>5%</span>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Win Rate</div>
              <div className="text-lg font-mono text-emerald-400">{marketData.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Max DD</div>
              <div className="text-lg font-mono text-red-400">-{maxDrawdown.toFixed(1)}%</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Sharpe</div>
              <div className="text-lg font-mono text-blue-400">{sharpeRatio.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Sortino</div>
              <div className="text-lg font-mono text-purple-400">{sortinoRatio.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="pt-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">Trade Statistics</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Total Trades</div>
              <div className="font-mono text-cyan-400">{marketData.totalTrades}</div>
            </div>
            <div>
              <div className="text-slate-400">Volatility</div>
              <div className="font-mono text-orange-400">{marketData.volatility.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Risk Alerts */}
        {marketData.portfolioHeat > 2.5 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>High risk detected - Consider position reduction</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
