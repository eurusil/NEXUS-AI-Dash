"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTradeStore } from "@/lib/trade-store"
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Zap,
  Shield,
  Globe,
  Clock,
  Users,
  Brain,
  Download,
  FileText,
  PieChart,
  Activity,
} from "lucide-react"

export function ReportsGenerator() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const { trades, getStats } = useTradeStore()
  const stats = getStats()

  const generateReport = async (reportType: string) => {
    setGeneratingReport(reportType)

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real implementation, this would generate and download the actual report
    console.log(`Generated ${reportType} report`)

    setGeneratingReport(null)
  }

  const reports = [
    {
      id: "daily-summary",
      title: "Daily Summary",
      description: "Comprehensive daily trading performance analysis",
      icon: Calendar,
      color: "blue",
      metrics: [
        `${
          trades.filter((t) => {
            const today = new Date().toDateString()
            return new Date(t.entryTime).toDateString() === today
          }).length
        } trades today`,
        `$${stats.totalPnL.toFixed(2)} total P&L`,
        `${stats.winRate.toFixed(1)}% win rate`,
      ],
    },
    {
      id: "weekly-analysis",
      title: "Weekly Analysis",
      description: "Weekly performance trends and pattern analysis",
      icon: BarChart3,
      color: "purple",
      metrics: [
        `${
          trades.filter((t) => {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return new Date(t.entryTime) >= weekAgo
          }).length
        } trades this week`,
        `${stats.profitFactor.toFixed(2)} profit factor`,
        `${stats.openTrades} open positions`,
      ],
    },
    {
      id: "monthly-report",
      title: "Monthly Report",
      description: "Complete monthly performance and strategy breakdown",
      icon: TrendingUp,
      color: "emerald",
      metrics: [
        `${stats.totalTrades} total trades`,
        `${stats.winningTrades} winning trades`,
        `${stats.losingTrades} losing trades`,
      ],
    },
    {
      id: "strategy-breakdown",
      title: "Strategy Breakdown",
      description: "Individual strategy performance and optimization insights",
      icon: Zap,
      color: "yellow",
      metrics: ["5 active strategies", "Performance comparison", "Optimization recommendations"],
    },
    {
      id: "risk-assessment",
      title: "Risk Assessment",
      description: "Comprehensive risk analysis and portfolio health check",
      icon: Shield,
      color: "orange",
      metrics: [
        `$${stats.maxDrawdown.toFixed(2)} max drawdown`,
        `${stats.sharpeRatio.toFixed(2)} Sharpe ratio`,
        "Risk recommendations",
      ],
    },
    {
      id: "market-correlation",
      title: "Market Correlation",
      description: "Market correlation analysis and sector exposure",
      icon: Globe,
      color: "cyan",
      metrics: ["Cross-asset correlation", "Sector exposure analysis", "Market timing insights"],
    },
    {
      id: "time-analysis",
      title: "Time Analysis",
      description: "Time-based performance patterns and optimal trading hours",
      icon: Clock,
      color: "pink",
      metrics: ["Best trading hours", "Day-of-week analysis", "Seasonal patterns"],
    },
    {
      id: "pair-trading",
      title: "Pair Trading Analysis",
      description: "Correlation and pair trading opportunities",
      icon: Users,
      color: "indigo",
      metrics: ["Correlation matrix", "Pair opportunities", "Hedge effectiveness"],
    },
    {
      id: "sentiment-analysis",
      title: "Sentiment Analysis",
      description: "Market sentiment and psychological trading patterns",
      icon: Brain,
      color: "teal",
      metrics: ["Sentiment indicators", "Psychology metrics", "Behavioral insights"],
    },
    {
      id: "performance-attribution",
      title: "Performance Attribution",
      description: "Detailed breakdown of performance sources",
      icon: PieChart,
      color: "violet",
      metrics: ["Strategy contribution", "Symbol performance", "Time attribution"],
    },
    {
      id: "trade-execution",
      title: "Trade Execution Analysis",
      description: "Execution quality and slippage analysis",
      icon: Activity,
      color: "rose",
      metrics: ["Execution efficiency", "Slippage analysis", "Fill quality metrics"],
    },
    {
      id: "compliance-report",
      title: "Compliance Report",
      description: "Regulatory compliance and audit trail",
      icon: FileText,
      color: "slate",
      metrics: ["Regulatory compliance", "Audit trail", "Documentation status"],
    },
  ]

  const quickStats = [
    {
      title: "Total Reports Generated",
      value: "247",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Last Report",
      value: "2 hours ago",
      icon: Clock,
      color: "emerald",
    },
    {
      title: "Export Formats",
      value: "PDF, Excel, CSV",
      icon: Download,
      color: "purple",
    },
    {
      title: "Data Coverage",
      value: `${stats.totalTrades} trades`,
      icon: BarChart3,
      color: "orange",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title} className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</div>
                    <div className="text-xs text-slate-400">{stat.title}</div>
                  </div>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Generation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const IconComponent = report.icon
          const isGenerating = generatingReport === report.id

          return (
            <Card
              key={report.id}
              className="bg-black/20 border-slate-700/50 backdrop-blur-xl hover:scale-105 transition-transform cursor-pointer"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`w-5 h-5 text-${report.color}-400`} />
                    <span className="text-base font-medium">{report.title}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-${report.color}-500/50 text-${report.color}-400 bg-${report.color}-500/10 text-xs`}
                  >
                    NEW
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">{report.description}</p>

                <div className="space-y-2">
                  {report.metrics.map((metric, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-slate-400">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${report.color}-400`} />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => generateReport(report.id)}
                  disabled={isGenerating}
                  className={`w-full bg-${report.color}-500/20 text-${report.color}-400 border-${report.color}-500/50 hover:bg-${report.color}-500/30`}
                  variant="outline"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Export Options */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-400" />
            <span>Export Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-red-400" />
                <span className="font-medium text-white">PDF Reports</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">Professional formatted reports with charts and analysis</p>
              <Button size="sm" variant="outline" className="w-full border-red-500/50 text-red-400 bg-transparent">
                Export as PDF
              </Button>
            </div>

            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-white">Excel Workbooks</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">Detailed data with pivot tables and interactive charts</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-emerald-500/50 text-emerald-400 bg-transparent"
              >
                Export as Excel
              </Button>
            </div>

            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">CSV Data</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">Raw data export for custom analysis and integration</p>
              <Button size="sm" variant="outline" className="w-full border-blue-500/50 text-blue-400 bg-transparent">
                Export as CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span>Scheduled Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Daily Summary", schedule: "Every day at 6:00 PM", status: "active" },
              { name: "Weekly Analysis", schedule: "Every Sunday at 8:00 AM", status: "active" },
              { name: "Monthly Report", schedule: "1st of every month", status: "active" },
              { name: "Risk Assessment", schedule: "Every Friday at 5:00 PM", status: "paused" },
            ].map((scheduled, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{scheduled.name}</div>
                  <div className="text-xs text-slate-400">{scheduled.schedule}</div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    scheduled.status === "active"
                      ? "border-emerald-500/50 text-emerald-400"
                      : "border-orange-500/50 text-orange-400"
                  }
                >
                  {scheduled.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
