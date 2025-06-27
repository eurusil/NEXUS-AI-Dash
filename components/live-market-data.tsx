"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tradingAPI, type MarketDataTick } from "@/lib/trading-api"
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react"

interface LiveMarketDataProps {
  connected: boolean
}

export function LiveMarketData({ connected }: LiveMarketDataProps) {
  const [marketData, setMarketData] = useState<Record<string, MarketDataTick>>({})
  const [selectedSymbols] = useState(["ES", "NQ", "RTY", "YM", "SPY", "QQQ"])

  useEffect(() => {
    if (!connected) {
      setMarketData({})
      return
    }

    // Subscribe to market data updates
    const handleMarketData = (tick: MarketDataTick) => {
      setMarketData((prev) => ({
        ...prev,
        [tick.symbol]: tick,
      }))
    }

    tradingAPI.onMarketData(handleMarketData)

    // Connect to market data for selected symbols
    tradingAPI.connectMarketData(selectedSymbols).catch((error) => {
      console.error("Failed to connect to market data:", error)
    })

    return () => {
      // Cleanup handled by tradingAPI.disconnect()
    }
  }, [connected, selectedSymbols])

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(2)}`
  }

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? "+" : ""
    return `${sign}${changePercent.toFixed(2)}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-emerald-400"
    if (change < 0) return "text-red-400"
    return "text-slate-400"
  }

  if (!connected) {
    return (
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <span>Live Market Data</span>
            <Badge variant="outline" className="border-slate-500/50 text-slate-400">
              DISCONNECTED
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Connect to a broker to view live market data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Live Market Data</span>
          </div>
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
            <Zap className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {selectedSymbols.map((symbol) => {
            const data = marketData[symbol]

            if (!data) {
              return (
                <div key={symbol} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="border-slate-500/50 text-slate-400">
                      {symbol}
                    </Badge>
                    <div className="text-sm text-slate-400">Waiting for data...</div>
                  </div>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )
            }

            return (
              <div
                key={symbol}
                className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    {symbol}
                  </Badge>
                  <div>
                    <div className="text-lg font-mono text-white">${formatPrice(data.price)}</div>
                    <div className="text-xs text-slate-400">
                      Bid: ${formatPrice(data.bid)} | Ask: ${formatPrice(data.ask)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`flex items-center space-x-1 ${getChangeColor(data.change)}`}>
                    {data.change > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : data.change < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    <div className="font-mono text-sm">{formatChange(data.change)}</div>
                  </div>
                  <div className={`text-xs font-mono ${getChangeColor(data.changePercent)}`}>
                    {formatChangePercent(data.changePercent)}
                  </div>
                  <div className="text-xs text-slate-500">Vol: {data.volume.toLocaleString()}</div>
                </div>

                <div className="text-xs text-slate-500">{new Date(data.timestamp).toLocaleTimeString()}</div>
              </div>
            )
          })}
        </div>

        {Object.keys(marketData).length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Connecting to market data feed...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
