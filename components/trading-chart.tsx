"use client"

import { useEffect, useRef } from "react"

interface MarketData {
  currentPrice: number
  timestamp: number
}

interface TradingChartProps {
  marketData: MarketData
}

/**
 * Very light-weight SVG spark-line.
 * Keeps the last 60 prices in a ref and draws a simple polyline.
 */
export function TradingChart({ marketData }: TradingChartProps) {
  const history = useRef<number[]>([])

  useEffect(() => {
    history.current.push(marketData.currentPrice)
    if (history.current.length > 60) history.current.shift()
  }, [marketData.currentPrice])

  const max = Math.max(...history.current, marketData.currentPrice)
  const min = Math.min(...history.current, marketData.currentPrice)
  const range = max - min || 1

  const points = history.current
    .map((p, i) => {
      const x = (i / 59) * 100
      const y = 100 - ((p - min) / range) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="h-48 w-full bg-gradient-to-b from-slate-900/40 to-black/40 rounded-lg relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute top-2 left-3 text-xs text-slate-400 font-mono">
        ES {marketData.currentPrice.toFixed(2)}
      </div>
    </div>
  )
}
