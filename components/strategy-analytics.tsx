"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTradeStore } from "@/lib/trade-store"
import { Zap, TrendingUp, AlertTriangle, CheckCircle, Brain } from "lucide-react"

export function StrategyAnalytics() {
  const { trades } = useTradeStore()

  // Calculate strategy performance
  const strategyPerformance = useMemo(() => {
    const strategies = {}

    trades.forEach((trade) => {
      if (!strategies[trade.strategy]) {
        strategies[trade.strategy] = {
          name: trade.strategy,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalPnL: 0,
          totalWins: 0,
          totalLosses: 0,
          openTrades: 0,
          avgHoldTime: 0,
          bestTrade: 0,
          worstTrade: 0,
          recentPerformance: [],
        }
      }

      const strategy = strategies[trade.strategy]
      strategy.totalTrades++

      if (trade.status === "Open") {
        strategy.openTrades++
        if (trade.unrealizedPnL) {
          strategy.totalPnL += trade.unrealizedPnL
        }
      } else if (trade.status === "Closed" && trade.pnl !== undefined) {
        strategy.totalPnL += trade.pnl

        if (trade.pnl > 0) {
          strategy.winningTrades++
          strategy.totalWins += trade.pnl
          strategy.bestTrade = Math.max(strategy.bestTrade, trade.pnl)
        } else {
          strategy.losingTrades++
          strategy.totalLosses += Math.abs(trade.pnl)
          strategy.worstTrade = Math.min(strategy.worstTrade, trade.pnl)
        }

        // Calculate hold time
        if (trade.exitTime) {
          const holdTime = new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime()
          strategy.avgHoldTime = (strategy.avgHoldTime * (strategy.totalTrades - 1) + holdTime) / strategy.totalTrades
        }

        // Track recent performance (last 10 trades)
        strategy.recentPerformance.push({
          pnl: trade.pnl,
          date: trade.entryTime,
        })
        if (strategy.recentPerformance.length > 10) {
          strategy.recentPerformance.shift()
        }
      }
    })

    return Object.values(strategies)
      .map((strategy: any) => ({
        ...strategy,
        winRate:
          strategy.totalTrades > 0 ? (strategy.winningTrades / (strategy.totalTrades - strategy.openTrades)) * 100 : 0,
        profitFactor:
          strategy.totalLosses > 0 ? strategy.totalWins / strategy.totalLosses : strategy.totalWins > 0 ? 999 : 0,
        avgWin: strategy.winningTrades > 0 ? strategy.totalWins / strategy.winningTrades : 0,
        avgLoss: strategy.losingTrades > 0 ? strategy.totalLosses / strategy.losingTrades : 0,
        avgHoldTimeHours: strategy.avgHoldTime / (1000 * 60 * 60),
        recentWinRate:
          strategy.recentPerformance.length > 0
            ? (strategy.recentPerformance.filter((t) => t.pnl > 0).length / strategy.recentPerformance.length) * 100
            : 0,
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL)
  }, [trades])

  // Generate AI insights
  const aiInsights = useMemo(() => {
    const insights = []

    // Find best performing strategy
    const bestStrategy = strategyPerformance.reduce(
      (best, current) => (current.totalPnL > best.totalPnL ? current : best),
      strategyPerformance[0],
    )

    if (bestStrategy && bestStrategy.winRate > 80) {
      insights.push({
        type: "strength",
        title: "Exceptional Strategy Performance",
        message: `${bestStrategy.name} shows outstanding performance with ${bestStrategy.winRate.toFixed(1)}% win rate and $${bestStrategy.totalPnL.toFixed(2)} total P&L. Consider increasing allocation.`,
        icon: CheckCircle,
        color: "emerald",
      })
    }

    // Find underperforming strategies
    const underperforming = strategyPerformance.filter((s) => s.winRate < 50 && s.totalTrades > 5)
    if (underperforming.length > 0) {
      insights.push({
        type: "warning",
        title: "Strategy Needs Review",
        message: `${underperforming[0].name} is underperforming with ${underperforming[0].winRate.toFixed(1)}% win rate. Review entry criteria and market conditions.`,
        icon: AlertTriangle,
        color: "orange",
      })
    }

    // Analyze recent performance trends
    strategyPerformance.forEach((strategy) => {
      if (strategy.recentPerformance.length >= 5) {
        const recentPnL = strategy.recentPerformance.slice(-5).reduce((sum, t) => sum + t.pnl, 0)
        if (recentPnL < -500 && strategy.totalPnL > 0) {
          insights.push({
            type: "caution",
            title: "Recent Performance Decline",
            message: `${strategy.name} has declined recently despite overall profitability. Monitor closely for potential adjustments.`,
            icon: TrendingUp,
            color: "yellow",
          })
        }
      }
    })

    // Strategy combination recommendations
    const profitableStrategies = strategyPerformance.filter((s) => s.totalPnL > 0 && s.winRate > 60)
    if (profitableStrategies.length >= 2) {
      insights.push({
        type: "recommendation",
        title: "Strategy Combination Opportunity",
        message: `Consider combining ${profitableStrategies[0].name} and ${profitableStrategies[1].name} for higher confidence setups.`,
        icon: Brain,
        color: "blue",
      })
    }

    return insights
  }, [strategyPerformance])

  const getStrategyStatus = (strategy: any) => {
    if (strategy.winRate > 75 && strategy.totalPnL > 0) return { status: "excellent", color: "emerald" }
    if (strategy.winRate > 60 && strategy.totalPnL > 0) return { status: "good", color: "blue" }
    if (strategy.winRate > 45) return { status: "average", color: "yellow" }
    return { status: "poor", color: "red" }
  }

  return (
    <div className="space-y-6">
      {/* Strategy Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategyPerformance.map((strategy) => {
          const status = getStrategyStatus(strategy)

          return (
            <Card key={strategy.name} className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-base font-medium">{strategy.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-${status.color}-500/50 text-${status.color}-400 bg-${status.color}-500/10`}
                  >
                    {status.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{strategy.totalTrades}</div>
                    <div className="text-xs text-slate-400">Total Trades</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-lg font-bold ${strategy.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      ${strategy.totalPnL.toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-400">Total P&L</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{strategy.winRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Win Rate</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Profit Factor</span>
                    <span className="text-purple-400 font-mono">{strategy.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Avg Win</span>
                    <span className="text-emerald-400 font-mono">${strategy.avgWin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Avg Loss</span>
                    <span className="text-red-400 font-mono">-${strategy.avgLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Best Trade</span>
                    <span className="text-emerald-400 font-mono">${strategy.bestTrade.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Worst Trade</span>
                    <span className="text-red-400 font-mono">${strategy.worstTrade.toFixed(2)}</span>
                  </div>
                </div>

                {/* Win Rate Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Win Rate Progress</span>
                    <span className="text-blue-400">{strategy.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={strategy.winRate} className="h-2 bg-slate-800" />
                </div>

                {/* Recent Performance Indicator */}
                {strategy.recentPerformance.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Recent Form (Last 10)</span>
                      <span
                        className={`font-mono ${strategy.recentWinRate >= strategy.winRate ? "text-emerald-400" : "text-orange-400"}`}
                      >
                        {strategy.recentWinRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      {strategy.recentPerformance.slice(-10).map((trade, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${trade.pnl > 0 ? "bg-emerald-400" : "bg-red-400"}`}
                          title={`${trade.pnl > 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Open Positions */}
                {strategy.openTrades > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-sm text-blue-400">
                      {strategy.openTrades} open position{strategy.openTrades > 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Insights */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span>AI Strategy Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => {
              const IconComponent = insight.icon
              return (
                <div
                  key={index}
                  className={`p-4 bg-${insight.color}-500/10 border border-${insight.color}-500/30 rounded-lg`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <IconComponent className={`w-4 h-4 text-${insight.color}-400`} />
                    <span className={`text-sm font-medium text-${insight.color}-400`}>{insight.title}</span>
                  </div>
                  <p className="text-sm text-slate-300">{insight.message}</p>
                </div>
              )
            })}

            {aiInsights.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No insights available yet</p>
                <p className="text-sm">Execute more trades to generate AI insights</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
