"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTradeStore } from "@/lib/trade-store"
import { Calendar, TrendingUp, TrendingDown, BarChart3, Target, DollarSign } from "lucide-react"

export function PerformanceAnalytics() {
  const { trades, getStats } = useTradeStore()
  const stats = getStats()

  // Calculate monthly performance
  const monthlyPerformance = useMemo(() => {
    const months = {}
    trades.forEach((trade) => {
      if (trade.status === "Closed" && trade.pnl) {
        const month = new Date(trade.entryTime).toLocaleString("default", { month: "long", year: "numeric" })
        if (!months[month]) {
          months[month] = { pnl: 0, trades: 0, wins: 0 }
        }
        months[month].pnl += trade.pnl
        months[month].trades += 1
        if (trade.pnl > 0) months[month].wins += 1
      }
    })

    return Object.entries(months)
      .map(([month, data]: [string, any]) => ({
        month,
        pnl: data.pnl,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      }))
      .slice(-6) // Last 6 months
  }, [trades])

  // Calculate daily performance for the last 30 days
  const dailyPerformance = useMemo(() => {
    const days = {}
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    trades.forEach((trade) => {
      if (trade.status === "Closed" && trade.pnl && new Date(trade.entryTime) >= last30Days) {
        const day = new Date(trade.entryTime).toISOString().split("T")[0]
        if (!days[day]) {
          days[day] = { pnl: 0, trades: 0 }
        }
        days[day].pnl += trade.pnl
        days[day].trades += 1
      }
    })

    return Object.entries(days)
      .map(([day, data]: [string, any]) => ({
        day,
        pnl: data.pnl,
        trades: data.trades,
      }))
      .sort((a, b) => a.day.localeCompare(b.day))
  }, [trades])

  // Calculate equity curve
  const equityCurve = useMemo(() => {
    let runningPnL = 0
    return trades
      .filter((t) => t.status === "Closed" && t.pnl)
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
      .map((trade) => {
        runningPnL += trade.pnl || 0
        return {
          date: new Date(trade.entryTime).toLocaleDateString(),
          equity: runningPnL,
          trade: trade,
        }
      })
  }, [trades])

  // Calculate drawdown periods
  const drawdownAnalysis = useMemo(() => {
    let peak = 0
    let maxDrawdown = 0
    let currentDrawdown = 0
    let drawdownStart = null
    let maxDrawdownPeriod = { start: null, end: null, amount: 0, duration: 0 }

    equityCurve.forEach((point, index) => {
      if (point.equity > peak) {
        peak = point.equity
        if (currentDrawdown > 0) {
          // End of drawdown period
          currentDrawdown = 0
          drawdownStart = null
        }
      } else {
        const drawdown = peak - point.equity
        if (drawdown > currentDrawdown) {
          currentDrawdown = drawdown
          if (!drawdownStart) {
            drawdownStart = point.date
          }
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown
            maxDrawdownPeriod = {
              start: drawdownStart,
              end: point.date,
              amount: drawdown,
              duration: index - equityCurve.findIndex((p) => p.date === drawdownStart),
            }
          }
        }
      }
    })

    return {
      maxDrawdown,
      currentDrawdown: peak - (equityCurve[equityCurve.length - 1]?.equity || 0),
      maxDrawdownPeriod,
    }
  }, [equityCurve])

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-emerald-400">
                  ${(stats.totalPnL + stats.unrealizedPnL).toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">Total P&L</div>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                <div className="text-xs text-slate-400">Win Rate</div>
              </div>
              <Target className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-purple-400">{stats.profitFactor.toFixed(2)}</div>
                <div className="text-xs text-slate-400">Profit Factor</div>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-orange-400">{stats.totalTrades}</div>
                <div className="text-xs text-slate-400">Total Trades</div>
              </div>
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Monthly Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyPerformance.map((month) => (
              <div key={month.month} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{month.month}</div>
                  <div className="text-xs text-slate-400">
                    {month.trades} trades • {month.winRate.toFixed(1)}% win rate
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-mono ${month.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {month.pnl >= 0 ? "+" : ""}${month.pnl.toFixed(2)}
                  </div>
                  <div className="w-24 bg-slate-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${month.pnl >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                      style={{ width: `${Math.min(100, (Math.abs(month.pnl) / 1000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equity Curve Visualization */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span>Equity Curve</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            {equityCurve.length > 0 ? (
              <div className="w-full h-full flex items-end space-x-1">
                {equityCurve.map((point, index) => {
                  const maxEquity = Math.max(...equityCurve.map((p) => p.equity))
                  const minEquity = Math.min(...equityCurve.map((p) => p.equity))
                  const range = maxEquity - minEquity || 1
                  const height = ((point.equity - minEquity) / range) * 100

                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${Math.max(2, height)}%` }}
                      title={`${point.date}: $${point.equity.toFixed(2)}`}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No trade data available</p>
                  <p className="text-sm">Start trading to see your equity curve</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawdown Analysis */}
      <div className="grid grid-cols-2 gap-6">
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
              <span className="text-red-400 font-mono">-${drawdownAnalysis.maxDrawdown.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Current Drawdown</span>
              <span className="text-orange-400 font-mono">-${drawdownAnalysis.currentDrawdown.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Recovery Factor</span>
              <span className="text-emerald-400 font-mono">
                {drawdownAnalysis.maxDrawdown > 0 ? (stats.totalPnL / drawdownAnalysis.maxDrawdown).toFixed(2) : "N/A"}
              </span>
            </div>
            {drawdownAnalysis.maxDrawdownPeriod.start && (
              <div className="pt-2 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Worst Drawdown Period</div>
                <div className="text-sm text-slate-300">
                  {drawdownAnalysis.maxDrawdownPeriod.start} - {drawdownAnalysis.maxDrawdownPeriod.end}
                </div>
                <div className="text-xs text-slate-400">
                  Duration: {drawdownAnalysis.maxDrawdownPeriod.duration} trades
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Trade Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-300">Winning Trades</span>
              <span className="text-emerald-400 font-mono">{stats.winningTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Losing Trades</span>
              <span className="text-red-400 font-mono">{stats.losingTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Average Win</span>
              <span className="text-emerald-400 font-mono">${stats.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Average Loss</span>
              <span className="text-red-400 font-mono">-${Math.abs(stats.avgLoss).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Win/Loss Ratio</span>
                <span className="text-blue-400 font-mono">
                  {stats.avgLoss !== 0 ? (stats.avgWin / Math.abs(stats.avgLoss)).toFixed(2) : "N/A"}
                </span>
              </div>
              <Progress value={stats.winRate} className="h-2 bg-slate-800" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
