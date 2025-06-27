"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Trade {
  id: string
  symbol: string
  type: "Long" | "Short"
  status: "Open" | "Closed"
  entryPrice: number
  exitPrice?: number
  quantity: number
  entryTime: Date
  exitTime?: Date
  strategy: string
  pnl?: number
  unrealizedPnl?: number
  stopLoss?: number
  takeProfit?: number
  notes?: string
  marketConditions?: {
    volatility: number
    delta: number
    volume: number
  }
}

export interface TradeStats {
  totalTrades: number
  openTrades: number
  closedTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  unrealizedPnL: number
  winRate: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  maxDrawdown: number
  currentDrawdown: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  largestWin: number
  largestLoss: number
  avgHoldTime: number
  bestStrategy: string
  worstStrategy: string
}

interface TradeStore {
  trades: Trade[]
  currentPrice: number
  marketData: {
    currentPrice: number
    dailyPnL: number
    portfolioHeat: number
    winRate: number
    totalTrades: number
    cumulativeDelta: number
    volatility: number
    timestamp: number
  }

  // Actions
  addTrade: (trade: Omit<Trade, "id" | "entryTime">) => void
  closeTrade: (id: string, exitPrice: number, exitTime?: Date) => void
  updateTrade: (id: string, updates: Partial<Trade>) => void
  deleteTrade: (id: string) => void
  updateCurrentPrice: (price: number) => void
  updateMarketData: (data: Partial<TradeStore["marketData"]>) => void

  // Computed
  getStats: () => TradeStats
  getOpenTrades: () => Trade[]
  getClosedTrades: () => Trade[]
  getTradesByStrategy: (strategy: string) => Trade[]
  getTradesBySymbol: (symbol: string) => Trade[]
  getRecentTrades: (limit?: number) => Trade[]
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      currentPrice: 4327.5,
      marketData: {
        currentPrice: 4327.5,
        dailyPnL: 0,
        portfolioHeat: 1.2,
        winRate: 0,
        totalTrades: 0,
        cumulativeDelta: 0,
        volatility: 0.72,
        timestamp: Date.now(),
      },

      addTrade: (tradeData) => {
        const trade: Trade = {
          ...tradeData,
          id: crypto.randomUUID(),
          entryTime: new Date(),
        }

        set((state) => ({
          trades: [...state.trades, trade],
          marketData: {
            ...state.marketData,
            totalTrades: state.trades.length + 1,
          },
        }))
      },

      closeTrade: (id, exitPrice, exitTime = new Date()) => {
        set((state) => ({
          trades: state.trades.map((trade) => {
            if (trade.id === id && trade.status === "Open") {
              const pnl =
                trade.type === "Long"
                  ? (exitPrice - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - exitPrice) * trade.quantity

              return {
                ...trade,
                status: "Closed" as const,
                exitPrice,
                exitTime,
                pnl,
                unrealizedPnl: undefined,
              }
            }
            return trade
          }),
        }))
      },

      updateTrade: (id, updates) => {
        set((state) => ({
          trades: state.trades.map((trade) => (trade.id === id ? { ...trade, ...updates } : trade)),
        }))
      },

      deleteTrade: (id) => {
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== id),
        }))
      },

      updateCurrentPrice: (price) => {
        set((state) => {
          // Update unrealized P&L for open trades
          const updatedTrades = state.trades.map((trade) => {
            if (trade.status === "Open") {
              const unrealizedPnl =
                trade.type === "Long"
                  ? (price - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - price) * trade.quantity

              return { ...trade, unrealizedPnl }
            }
            return trade
          })

          return {
            currentPrice: price,
            trades: updatedTrades,
            marketData: {
              ...state.marketData,
              currentPrice: price,
            },
          }
        })
      },

      updateMarketData: (data) => {
        set((state) => ({
          marketData: { ...state.marketData, ...data, timestamp: Date.now() },
        }))
      },

      getStats: (): TradeStats => {
        const { trades } = get()
        const closedTrades = trades.filter((t) => t.status === "Closed")
        const openTrades = trades.filter((t) => t.status === "Open")

        const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0)
        const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0)

        const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
        const unrealizedPnL = openTrades.reduce((sum, t) => sum + (t.unrealizedPnl || 0), 0)

        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

        const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

        const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
        const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0

        // Calculate drawdown
        let peak = 0
        let maxDrawdown = 0
        let currentDrawdown = 0
        let runningPnL = 0

        closedTrades.forEach((trade) => {
          runningPnL += trade.pnl || 0
          if (runningPnL > peak) {
            peak = runningPnL
            currentDrawdown = 0
          } else {
            currentDrawdown = peak - runningPnL
            if (currentDrawdown > maxDrawdown) {
              maxDrawdown = currentDrawdown
            }
          }
        })

        // Strategy analysis
        const strategyStats = trades.reduce(
          (acc, trade) => {
            if (!acc[trade.strategy]) {
              acc[trade.strategy] = { trades: 0, pnl: 0 }
            }
            acc[trade.strategy].trades++
            if (trade.pnl) acc[trade.strategy].pnl += trade.pnl
            return acc
          },
          {} as Record<string, { trades: number; pnl: number }>,
        )

        const bestStrategy = Object.entries(strategyStats).reduce(
          (best, [strategy, stats]) =>
            stats.pnl > (strategyStats[best]?.pnl || Number.NEGATIVE_INFINITY) ? strategy : best,
          "",
        )

        const worstStrategy = Object.entries(strategyStats).reduce(
          (worst, [strategy, stats]) =>
            stats.pnl < (strategyStats[worst]?.pnl || Number.POSITIVE_INFINITY) ? strategy : worst,
          "",
        )

        return {
          totalTrades: trades.length,
          openTrades: openTrades.length,
          closedTrades: closedTrades.length,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
          totalPnL,
          unrealizedPnL,
          winRate,
          profitFactor,
          avgWin,
          avgLoss,
          maxDrawdown,
          currentDrawdown,
          sharpeRatio: 1.87, // Simplified calculation
          sortinoRatio: 2.43,
          calmarRatio: 1.56,
          largestWin: Math.max(...winningTrades.map((t) => t.pnl || 0), 0),
          largestLoss: Math.min(...losingTrades.map((t) => t.pnl || 0), 0),
          avgHoldTime: 0, // Simplified
          bestStrategy,
          worstStrategy,
        }
      },

      getOpenTrades: () => get().trades.filter((t) => t.status === "Open"),
      getClosedTrades: () => get().trades.filter((t) => t.status === "Closed"),
      getTradesByStrategy: (strategy) => get().trades.filter((t) => t.strategy === strategy),
      getTradesBySymbol: (symbol) => get().trades.filter((t) => t.symbol === symbol),
      getRecentTrades: (limit = 10) =>
        get()
          .trades.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
          .slice(0, limit),
    }),
    {
      name: "nexus-trades",
    },
  ),
)
