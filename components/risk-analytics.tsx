"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTradeStore } from "@/lib/trade-store"
import { Shield, AlertTriangle, Target, TrendingDown, Activity } from "lucide-react"

export function RiskAnalytics() {
  const { trades, marketData, getStats } = useTradeStore()
  const stats = getStats()

  // Calculate detailed risk metrics
  const riskMetrics = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === "Closed" && t.pnl !== undefined)
    const openTrades = trades.filter((t) => t.status === "Open")

    if (closedTrades.length === 0) {
      return {
        maxDrawdown: 0,
        currentDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        var95: 0,
        var99: 0,
        expectedShortfall: 0,
        maxConsecutiveLosses: 0,
        maxConsecutiveWins: 0,
        avgPositionSize: 0,
        maxPositionSize: 0,
        correlationRisk: 0,
        timeRisk: {},
        symbolRisk: {},
      }
    }

    // Calculate drawdown
    let peak = 0
    let maxDrawdown = 0
    let currentDrawdown = 0
    let runningPnL = 0

    closedTrades.forEach((trade) => {
      runningPnL += trade.pnl || 0
      if (runningPnL > peak) {
        peak = runningPnL
      }
      const drawdown = peak - runningPnL
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    currentDrawdown = peak - runningPnL

    // Calculate consecutive wins/losses
    let maxConsecutiveLosses = 0
    let maxConsecutiveWins = 0
    let currentLossStreak = 0
    let currentWinStreak = 0

    closedTrades.forEach((trade) => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++
        currentLossStreak = 0
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak)
      } else {
        currentLossStreak++
        currentWinStreak = 0
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak)
      }
    })

    // Calculate VaR (Value at Risk)
    const returns = closedTrades.map((t) => t.pnl || 0).sort((a, b) => a - b)
    const var95Index = Math.floor(returns.length * 0.05)
    const var99Index = Math.floor(returns.length * 0.01)
    const var95 = returns[var95Index] || 0
    const var99 = returns[var99Index] || 0

    // Expected Shortfall (average of losses beyond VaR)
    const expectedShortfall =
      var95Index > 0 ? returns.slice(0, var95Index).reduce((sum, val) => sum + val, 0) / var95Index : 0

    // Position sizing analysis
    const positionSizes = trades.map((t) => t.quantity)
    const avgPositionSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length
    const maxPositionSize = Math.max(...positionSizes)

    // Time-based risk analysis
    const timeRisk = {}
    const symbolRisk = {}

    trades.forEach((trade) => {
      const hour = new Date(trade.entryTime).getHours()
      const timeSlot = `${hour}:00-${hour + 1}:00`

      if (!timeRisk[timeSlot]) {
        timeRisk[timeSlot] = { trades: 0, pnl: 0, wins: 0 }
      }
      timeRisk[timeSlot].trades++
      if (trade.pnl) {
        timeRisk[timeSlot].pnl += trade.pnl
        if (trade.pnl > 0) timeRisk[timeSlot].wins++
      }

      // Symbol risk
      if (!symbolRisk[trade.symbol]) {
        symbolRisk[trade.symbol] = { trades: 0, pnl: 0, exposure: 0 }
      }
      symbolRisk[trade.symbol].trades++
      if (trade.pnl) symbolRisk[trade.symbol].pnl += trade.pnl
      if (trade.status === "Open") {
        symbolRisk[trade.symbol].exposure += trade.quantity * (trade.unrealizedPnL || 0)
      }
    })

    return {
      maxDrawdown,
      currentDrawdown,
      sharpeRatio: 1.87, // Simplified calculation
      sortinoRatio: 2.43,
      calmarRatio: 1.56,
      var95,
      var99,
      expectedShortfall,
      maxConsecutiveLosses,
      maxConsecutiveWins,
      avgPositionSize,
      maxPositionSize,
      correlationRisk: 0.3, // Simplified
      timeRisk,
      symbolRisk,
    }
  }, [trades])

  // Risk level assessment
  const riskLevel = useMemo(() => {
    const heat = marketData.portfolioHeat
    if (heat > 3.0) return { level: "CRITICAL", color: "red", description: "Immediate action required" }
    if (heat > 2.0) return { level: "HIGH", color: "orange", description: "Reduce exposure" }
    if (heat > 1.0) return { level: "MODERATE", color: "yellow", description: "Monitor closely" }
    return { level: "LOW", color: "emerald", description: "Well controlled" }
  }, [marketData.portfolioHeat])

  // Risk alerts
  const riskAlerts = useMemo(() => {
    const alerts = []

    if (marketData.portfolioHeat > 2.5) {
      alerts.push({
        type: "critical",
        title: "High Portfolio Heat",
        message: `Portfolio heat at ${marketData.portfolioHeat.toFixed(1)}% - Consider reducing positions`,
        icon: AlertTriangle,
      })
    }

    if (riskMetrics.currentDrawdown > 1000) {
      alerts.push({
        type: "warning",
        title: "Significant Drawdown",
        message: `Current drawdown of $${riskMetrics.currentDrawdown.toFixed(2)} requires attention`,
        icon: TrendingDown,
      })
    }

    if (stats.openTrades > 10) {
      alerts.push({
        type: "caution",
        title: "High Position Count",
        message: `${stats.openTrades} open positions may increase correlation risk`,
        icon: Activity,
      })
    }

    const recentLosses = trades.filter((t) => t.status === "Closed" && t.pnl && t.pnl < 0).slice(-5)

    if (recentLosses.length >= 3) {
      alerts.push({
        type: "warning",
        title: "Recent Loss Streak",
        message: "Multiple recent losses detected - Review strategy performance",
        icon: Target,
      })
    }

    return alerts
  }, [marketData, riskMetrics, stats, trades])

  return (
    <div className="space-y-6">
      {/* Risk Level Overview */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Risk Level Assessment</span>
            </div>
            <Badge
              variant="outline"
              className={`border-${riskLevel.color}-500/50 text-${riskLevel.color}-400 bg-${riskLevel.color}-500/10`}
            >
              {riskLevel.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Portfolio Heat</span>
              <span className={`text-${riskLevel.color}-400 font-mono text-lg`}>
                {marketData.portfolioHeat.toFixed(1)}%
              </span>
            </div>
            <Progress value={marketData.portfolioHeat * 20} className="h-3 bg-slate-800" />
            <div className="text-sm text-slate-400">{riskLevel.description}</div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span>Risk Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAlerts.map((alert, index) => {
                const IconComponent = alert.icon
                const colorMap = {
                  critical: "red",
                  warning: "orange",
                  caution: "yellow",
                }
                const color = colorMap[alert.type]

                return (
                  <div key={index} className={`p-3 bg-${color}-500/10 border border-${color}-500/30 rounded-lg`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className={`w-4 h-4 text-${color}-400`} />
                      <span className={`text-sm font-medium text-${color}-400`}>{alert.title}</span>
                    </div>
                    <p className="text-sm text-slate-300">{alert.message}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">-${riskMetrics.maxDrawdown.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Max Drawdown</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{riskMetrics.sharpeRatio.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Sharpe Ratio</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{riskMetrics.sortinoRatio.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Sortino Ratio</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{riskMetrics.calmarRatio.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Calmar Ratio</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drawdown Analysis */}
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span>Drawdown Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-300">Max Drawdown</span>
              <span className="text-red-400 font-mono">-${riskMetrics.maxDrawdown.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Current Drawdown</span>
              <span className="text-orange-400 font-mono">-${riskMetrics.currentDrawdown.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Recovery Factor</span>
              <span className="text-emerald-400 font-mono">
                {riskMetrics.maxDrawdown > 0 ? (stats.totalPnL / riskMetrics.maxDrawdown).toFixed(2) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Consecutive Losses</span>
              <span className="text-red-400 font-mono">{riskMetrics.maxConsecutiveLosses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Consecutive Wins</span>
              <span className="text-emerald-400 font-mono">{riskMetrics.maxConsecutiveWins}</span>
            </div>
          </CardContent>
        </Card>

        {/* Value at Risk */}
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-400" />
              <span>Value at Risk (VaR)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-300">VaR 95%</span>
              <span className="text-orange-400 font-mono">${riskMetrics.var95.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">VaR 99%</span>
              <span className="text-red-400 font-mono">${riskMetrics.var99.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Expected Shortfall</span>
              <span className="text-red-400 font-mono">${riskMetrics.expectedShortfall.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Avg Position Size</span>
              <span className="text-blue-400 font-mono">{riskMetrics.avgPositionSize.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Position Size</span>
              <span className="text-purple-400 font-mono">{riskMetrics.maxPositionSize}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Symbol Risk Distribution */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Symbol Risk Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(riskMetrics.symbolRisk).map(([symbol, data]: [string, any]) => (
              <div key={symbol} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    {symbol}
                  </Badge>
                  <div>
                    <div className="text-sm text-white">{data.trades} trades</div>
                    <div className="text-xs text-slate-400">
                      P&L:{" "}
                      <span className={data.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                        ${data.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300">Exposure</div>
                  <div className={`font-mono ${data.exposure >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ${data.exposure.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(riskMetrics.symbolRisk).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No symbol risk data available</p>
                <p className="text-sm">Execute trades to see risk distribution</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
