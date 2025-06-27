"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, BarChart3 } from "lucide-react"

interface MarketData {
  cumulativeDelta: number
}

interface MarketAnalyticsProps {
  marketData: MarketData
}

/**
 * CSS / SVG based sentiment orb – zero WebGL usage.
 */
export function MarketAnalytics({ marketData }: MarketAnalyticsProps) {
  const sentiment = Math.sign(marketData.cumulativeDelta)
  const strength = Math.min(1, Math.abs(marketData.cumulativeDelta) / 5000)

  const color = sentiment > 0 ? "emerald" : sentiment < 0 ? "red" : "slate" // Tailwind colour stem

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Sentiment Orb */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-base font-medium">Market&nbsp;Sentiment</span>
            </div>
            <Badge variant="outline" className={`border-${color}-500/50 text-${color}-400 bg-${color}-500/10`}>
              {sentiment > 0 ? "BULLISH" : sentiment < 0 ? "BEARISH" : "NEUTRAL"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Orb */}
          <div className="relative mx-auto my-4 w-28 h-28">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 animate-pulse opacity-70`}
              style={{ filter: `blur(${8 + strength * 12}px)` }}
            />
            <div
              className={`relative flex items-center justify-center w-full h-full rounded-full border-2 border-${color}-500/40`}
            >
              <span className={`font-mono text-${color}-200 text-sm`}>{(strength * 100).toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Profile placeholder (unchanged visual, still no WebGL) */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <span className="text-base font-medium">Volume&nbsp;Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          {/* … existing HTML-only volume stats remain … */}
          <p>Bid / Ask volume statistics (no WebGL needed).</p>
        </CardContent>
      </Card>
    </div>
  )
}
