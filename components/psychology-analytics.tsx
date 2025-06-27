"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useTradeStore } from "@/lib/trade-store"
import { Brain, TrendingUp, TrendingDown, Target, Clock, Award, AlertTriangle, Smile, Frown, Meh } from "lucide-react"

interface EmotionalState {
  emotion: "confident" | "fearful" | "greedy" | "disciplined" | "frustrated" | "euphoric"
  intensity: number
  timestamp: number
  tradeId?: string
}

interface PsychologyMetrics {
  emotionalStability: number
  disciplineScore: number
  riskTolerance: number
  streakHandling: number
  bestTime: string
  worstTime: string
  emotionalStates: EmotionalState[]
  achievements: string[]
  warnings: string[]
}

export function PsychologyAnalytics() {
  const { trades } = useTradeStore()
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M")
  const [psychologyMetrics, setPsychologyMetrics] = useState<PsychologyMetrics>({
    emotionalStability: 0,
    disciplineScore: 0,
    riskTolerance: 0,
    streakHandling: 0,
    bestTime: "09:30-10:30",
    worstTime: "15:00-16:00",
    emotionalStates: [],
    achievements: [],
    warnings: [],
  })

  useEffect(() => {
    calculatePsychologyMetrics()
  }, [trades, selectedTimeframe])

  const calculatePsychologyMetrics = () => {
    const closedTrades = trades.filter((trade) => trade.status === "CLOSED")

    if (closedTrades.length === 0) {
      setPsychologyMetrics({
        emotionalStability: 75,
        disciplineScore: 80,
        riskTolerance: 70,
        streakHandling: 85,
        bestTime: "09:30-10:30",
        worstTime: "15:00-16:00",
        emotionalStates: [
          { emotion: "confident", intensity: 75, timestamp: Date.now() - 3600000 },
          { emotion: "disciplined", intensity: 80, timestamp: Date.now() - 7200000 },
          { emotion: "fearful", intensity: 30, timestamp: Date.now() - 10800000 },
        ],
        achievements: [
          "Maintained discipline during drawdown",
          "Consistent risk management",
          "Emotional control improvement",
        ],
        warnings: ["Consider reducing position size during high volatility", "Take breaks after consecutive losses"],
      })
      return
    }

    // Calculate emotional stability based on trade consistency
    const pnlVariance = calculatePnLVariance(closedTrades)
    const emotionalStability = Math.max(0, Math.min(100, 100 - pnlVariance * 10))

    // Calculate discipline score based on rule adherence
    const disciplineScore = calculateDisciplineScore(closedTrades)

    // Calculate risk tolerance based on position sizing consistency
    const riskTolerance = calculateRiskTolerance(closedTrades)

    // Calculate streak handling ability
    const streakHandling = calculateStreakHandling(closedTrades)

    // Find best and worst trading times
    const timeAnalysis = analyzeTimePerformance(closedTrades)

    // Generate emotional states based on recent trades
    const emotionalStates = generateEmotionalStates(closedTrades)

    // Generate achievements and warnings
    const achievements = generateAchievements(closedTrades, emotionalStability, disciplineScore)
    const warnings = generateWarnings(closedTrades, emotionalStability, disciplineScore)

    setPsychologyMetrics({
      emotionalStability,
      disciplineScore,
      riskTolerance,
      streakHandling,
      bestTime: timeAnalysis.bestTime,
      worstTime: timeAnalysis.worstTime,
      emotionalStates,
      achievements,
      warnings,
    })
  }

  const calculatePnLVariance = (trades: any[]) => {
    if (trades.length < 2) return 0
    const pnls = trades.map((trade) => trade.pnl || 0)
    const mean = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length
    const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) / pnls.length
    return Math.sqrt(variance) / 1000 // Normalize
  }

  const calculateDisciplineScore = (trades: any[]) => {
    let disciplinePoints = 0
    let totalChecks = 0

    trades.forEach((trade) => {
      totalChecks += 3

      // Check if stop loss was used
      if (trade.stopLoss) disciplinePoints += 1

      // Check if position size was reasonable (< 5% of account)
      if (trade.quantity * trade.entryPrice < 50000) disciplinePoints += 1

      // Check if trade had a plan (notes)
      if (trade.notes && trade.notes.length > 10) disciplinePoints += 1
    })

    return totalChecks > 0 ? (disciplinePoints / totalChecks) * 100 : 80
  }

  const calculateRiskTolerance = (trades: any[]) => {
    const positionSizes = trades.map((trade) => trade.quantity * (trade.entryPrice || 0))
    const avgSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length
    const maxSize = Math.max(...positionSizes)

    // Lower variance in position sizes = higher risk tolerance score
    const consistency = avgSize > 0 ? Math.min(100, (avgSize / maxSize) * 100) : 70
    return consistency
  }

  const calculateStreakHandling = (trades: any[]) => {
    let currentStreak = 0
    let maxDrawdownDuringStreak = 0
    let streakRecoveries = 0

    trades.forEach((trade, index) => {
      const pnl = trade.pnl || 0

      if (pnl > 0) {
        currentStreak += 1
      } else {
        if (currentStreak >= 3) {
          streakRecoveries += 1
        }
        currentStreak = 0
        maxDrawdownDuringStreak = Math.min(maxDrawdownDuringStreak, pnl)
      }
    })

    // Score based on ability to handle streaks and recover from losses
    return Math.min(100, 60 + streakRecoveries * 10 + Math.max(0, maxDrawdownDuringStreak / -100))
  }

  const analyzeTimePerformance = (trades: any[]) => {
    const hourlyPnL: { [hour: string]: number[] } = {}

    trades.forEach((trade) => {
      const hour = new Date(trade.entryTime).getHours()
      const timeSlot = `${hour.toString().padStart(2, "0")}:00-${(hour + 1).toString().padStart(2, "0")}:00`

      if (!hourlyPnL[timeSlot]) hourlyPnL[timeSlot] = []
      hourlyPnL[timeSlot].push(trade.pnl || 0)
    })

    let bestTime = "09:30-10:30"
    let worstTime = "15:00-16:00"
    let bestAvg = Number.NEGATIVE_INFINITY
    let worstAvg = Number.POSITIVE_INFINITY

    Object.entries(hourlyPnL).forEach(([timeSlot, pnls]) => {
      const avg = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestTime = timeSlot
      }
      if (avg < worstAvg) {
        worstAvg = avg
        worstTime = timeSlot
      }
    })

    return { bestTime, worstTime }
  }

  const generateEmotionalStates = (trades: any[]): EmotionalState[] => {
    const states: EmotionalState[] = []
    const recentTrades = trades.slice(-10)

    recentTrades.forEach((trade, index) => {
      const pnl = trade.pnl || 0
      let emotion: EmotionalState["emotion"]
      let intensity: number

      if (pnl > 1000) {
        emotion = "euphoric"
        intensity = Math.min(100, 60 + pnl / 100)
      } else if (pnl > 0) {
        emotion = "confident"
        intensity = Math.min(100, 50 + pnl / 50)
      } else if (pnl > -500) {
        emotion = "disciplined"
        intensity = 70
      } else if (pnl > -1000) {
        emotion = "frustrated"
        intensity = Math.min(100, 40 + Math.abs(pnl) / 50)
      } else {
        emotion = "fearful"
        intensity = Math.min(100, 60 + Math.abs(pnl) / 100)
      }

      states.push({
        emotion,
        intensity,
        timestamp: new Date(trade.entryTime).getTime(),
        tradeId: trade.id,
      })
    })

    return states.slice(-5) // Keep last 5 states
  }

  const generateAchievements = (trades: any[], stability: number, discipline: number): string[] => {
    const achievements: string[] = []

    if (stability > 80) achievements.push("Emotional Stability Master")
    if (discipline > 85) achievements.push("Discipline Champion")
    if (trades.length > 100) achievements.push("Experienced Trader")

    const winRate = trades.filter((t) => (t.pnl || 0) > 0).length / trades.length
    if (winRate > 0.6) achievements.push("High Win Rate Achiever")

    const consecutiveWins = getMaxConsecutiveWins(trades)
    if (consecutiveWins >= 5) achievements.push("Winning Streak Expert")

    return achievements
  }

  const generateWarnings = (trades: any[], stability: number, discipline: number): string[] => {
    const warnings: string[] = []

    if (stability < 50) warnings.push("High emotional volatility detected")
    if (discipline < 60) warnings.push("Consider improving risk management")

    const recentLosses = trades.slice(-5).filter((t) => (t.pnl || 0) < 0).length
    if (recentLosses >= 4) warnings.push("Multiple recent losses - consider taking a break")

    const avgPositionSize = trades.reduce((sum, t) => sum + t.quantity * (t.entryPrice || 0), 0) / trades.length
    if (avgPositionSize > 25000) warnings.push("Position sizes may be too large")

    return warnings
  }

  const getMaxConsecutiveWins = (trades: any[]): number => {
    let maxStreak = 0
    let currentStreak = 0

    trades.forEach((trade) => {
      if ((trade.pnl || 0) > 0) {
        currentStreak += 1
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    return maxStreak
  }

  const getEmotionIcon = (emotion: EmotionalState["emotion"]) => {
    switch (emotion) {
      case "confident":
      case "disciplined":
        return <Smile className="w-4 h-4 text-emerald-400" />
      case "euphoric":
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case "fearful":
      case "frustrated":
        return <Frown className="w-4 h-4 text-red-400" />
      default:
        return <Meh className="w-4 h-4 text-yellow-400" />
    }
  }

  const getEmotionColor = (emotion: EmotionalState["emotion"]) => {
    switch (emotion) {
      case "confident":
      case "disciplined":
        return "text-emerald-400"
      case "euphoric":
        return "text-green-400"
      case "fearful":
      case "frustrated":
        return "text-red-400"
      default:
        return "text-yellow-400"
    }
  }

  return (
    <div className="space-y-6 p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Psychology Analytics</h2>
        </div>
        <div className="flex space-x-2">
          {["1D", "1W", "1M", "3M", "1Y"].map((period) => (
            <Button
              key={period}
              variant={selectedTimeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(period)}
              className={
                selectedTimeframe === period
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Psychology Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
              <Brain className="w-4 h-4 mr-2 text-purple-400" />
              Emotional Stability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-white">{psychologyMetrics.emotionalStability.toFixed(0)}%</div>
              <Progress value={psychologyMetrics.emotionalStability} className="h-2" />
              <div className="text-xs text-slate-400">
                {psychologyMetrics.emotionalStability > 75
                  ? "Excellent"
                  : psychologyMetrics.emotionalStability > 50
                    ? "Good"
                    : "Needs Improvement"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-400" />
              Discipline Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-white">{psychologyMetrics.disciplineScore.toFixed(0)}%</div>
              <Progress value={psychologyMetrics.disciplineScore} className="h-2" />
              <div className="text-xs text-slate-400">Rule adherence & planning</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
              Risk Tolerance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-white">{psychologyMetrics.riskTolerance.toFixed(0)}%</div>
              <Progress value={psychologyMetrics.riskTolerance} className="h-2" />
              <div className="text-xs text-slate-400">Position sizing consistency</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-400" />
              Streak Handling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-white">{psychologyMetrics.streakHandling.toFixed(0)}%</div>
              <Progress value={psychologyMetrics.streakHandling} className="h-2" />
              <div className="text-xs text-slate-400">Win/loss streak management</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Time Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div>
                <div className="text-sm text-slate-300">Best Trading Time</div>
                <div className="text-lg font-semibold text-emerald-400">{psychologyMetrics.bestTime}</div>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div>
                <div className="text-sm text-slate-300">Worst Trading Time</div>
                <div className="text-lg font-semibold text-red-400">{psychologyMetrics.worstTime}</div>
              </div>
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Emotional States */}
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-400" />
              Recent Emotional States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {psychologyMetrics.emotionalStates.map((state, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getEmotionIcon(state.emotion)}
                    <div>
                      <div className={`text-sm font-medium capitalize ${getEmotionColor(state.emotion)}`}>
                        {state.emotion}
                      </div>
                      <div className="text-xs text-slate-400">{new Date(state.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{state.intensity}%</div>
                    <Progress value={state.intensity} className="w-16 h-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements and Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-400" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {psychologyMetrics.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">{achievement}</span>
                </div>
              ))}
              {psychologyMetrics.achievements.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">Keep trading to unlock achievements!</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              Warnings & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {psychologyMetrics.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{warning}</span>
                </div>
              ))}
              {psychologyMetrics.warnings.length === 0 && (
                <div className="text-sm text-emerald-400 text-center py-4 flex items-center justify-center space-x-2">
                  <Smile className="w-4 h-4" />
                  <span>All systems looking good!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
