"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  LineChart,
  Clock,
  Filter,
  Download,
  Settings,
} from "lucide-react"
import { TradeManager } from "./trade-manager"
import { useTradeStore } from "@/lib/trade-store"
import { PerformanceAnalytics } from "./performance-analytics"
import { StrategyAnalytics } from "./strategy-analytics"
import { RiskAnalytics } from "./risk-analytics"
import { PsychologyAnalytics } from "./psychology-analytics"
import { ReportsGenerator } from "./reports-generator"

interface TradingJournalProps {
  onBack: () => void
}

export function TradingJournal({ onBack }: TradingJournalProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { getStats, getRecentTrades, getOpenTrades } = useTradeStore()
  const stats = getStats()
  const openTrades = getOpenTrades()
  const recentClosedTrades = getRecentTrades(10).filter((t) => t.status === "Closed")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-slate-800/50 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-light tracking-wide text-white">Trading Journal</div>
                  <div className="text-xs text-slate-400 -mt-1">Advanced Performance Analytics</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with proper scrolling */}
      <div className="container mx-auto px-8 py-8 h-[calc(100vh-100px)] overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-7 bg-black/20 border border-slate-700/50 sticky top-0 z-40">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300"
            >
              Trade Manager
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="strategies"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300"
            >
              Strategies
            </TabsTrigger>
            <TabsTrigger
              value="risk"
              className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300"
            >
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger
              value="psychology"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
            >
              Psychology
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300"
            >
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-4 gap-6">
              <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">
                        ${(stats.totalPnL + stats.unrealizedPnL).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">Total P&L</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                      <div className="text-sm text-slate-400">Win Rate</div>
                    </div>
                    <Target className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{stats.profitFactor.toFixed(2)}</div>
                      <div className="text-sm text-slate-400">Profit Factor</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-400">{stats.totalTrades}</div>
                      <div className="text-sm text-slate-400">Total Trades</div>
                    </div>
                    <Activity className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Trades & Performance Chart */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span>Recent Trades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentClosedTrades.slice(0, 5).map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="outline"
                            className={
                              trade.type === "Long"
                                ? "border-emerald-500/50 text-emerald-400"
                                : "border-red-500/50 text-red-400"
                            }
                          >
                            {trade.type}
                          </Badge>
                          <div>
                            <div className="text-sm font-mono text-white">{trade.symbol}</div>
                            <div className="text-xs text-slate-400">{trade.strategy}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-mono ${(trade.pnl || 0) > 0 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {(trade.pnl || 0) > 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">{new Date(trade.entryTime).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                    {recentClosedTrades.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No recent trades</p>
                        <p className="text-sm">Start trading to see your history</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="w-5 h-5 text-purple-400" />
                    <span>Equity Curve</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Interactive equity curve visualization</p>
                      <p className="text-sm">Shows cumulative P&L over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trade Manager Tab */}
          <TabsContent value="trades" className="space-y-6">
            <TradeManager />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceAnalytics />
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <StrategyAnalytics />
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-6">
            <RiskAnalytics />
          </TabsContent>

          {/* Psychology Tab */}
          <TabsContent value="psychology" className="space-y-6">
            <PsychologyAnalytics />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
