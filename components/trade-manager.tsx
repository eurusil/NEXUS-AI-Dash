"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useTradeStore } from "@/lib/trade-store"
import { Plus, X, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react"

export function TradeManager() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    symbol: "ES",
    type: "Long" as "Long" | "Short",
    entryPrice: "",
    quantity: "",
    strategy: "Liquidity Absorption",
    stopLoss: "",
    takeProfit: "",
    notes: "",
  })

  const { addTrade, closeTrade, getOpenTrades, getRecentTrades, currentPrice } = useTradeStore()
  const openTrades = getOpenTrades()
  const recentTrades = getRecentTrades(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.entryPrice || !formData.quantity) return

    addTrade({
      symbol: formData.symbol,
      type: formData.type,
      status: "Open",
      entryPrice: Number.parseFloat(formData.entryPrice),
      quantity: Number.parseInt(formData.quantity),
      strategy: formData.strategy,
      stopLoss: formData.stopLoss ? Number.parseFloat(formData.stopLoss) : undefined,
      takeProfit: formData.takeProfit ? Number.parseFloat(formData.takeProfit) : undefined,
      notes: formData.notes || undefined,
      marketConditions: {
        volatility: 0.72,
        delta: Math.floor(Math.random() * 2000 - 1000),
        volume: Math.floor(Math.random() * 1000000),
      },
    })

    // Reset form
    setFormData({
      symbol: "ES",
      type: "Long",
      entryPrice: "",
      quantity: "",
      strategy: "Liquidity Absorption",
      stopLoss: "",
      takeProfit: "",
      notes: "",
    })
    setShowAddForm(false)
  }

  const handleCloseTrade = (tradeId: string) => {
    closeTrade(tradeId, currentPrice)
  }

  return (
    <div className="space-y-6">
      {/* Add Trade Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Trade Management</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Trade
        </Button>
      </div>

      {/* Add Trade Form */}
      {showAddForm && (
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Trade</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Select value={formData.symbol} onValueChange={(value) => setFormData({ ...formData, symbol: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ES">ES (S&P 500)</SelectItem>
                    <SelectItem value="NQ">NQ (Nasdaq)</SelectItem>
                    <SelectItem value="RTY">RTY (Russell)</SelectItem>
                    <SelectItem value="YM">YM (Dow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Direction</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "Long" | "Short") => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Long">Long</SelectItem>
                    <SelectItem value="Short">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entryPrice">Entry Price</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                  placeholder="4327.50"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="strategy">Strategy</Label>
                <Select
                  value={formData.strategy}
                  onValueChange={(value) => setFormData({ ...formData, strategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Liquidity Absorption">Liquidity Absorption</SelectItem>
                    <SelectItem value="Delta Divergence">Delta Divergence</SelectItem>
                    <SelectItem value="HVN Rejection">HVN Rejection</SelectItem>
                    <SelectItem value="Momentum Breakout">Momentum Breakout</SelectItem>
                    <SelectItem value="Iceberg Detection">Iceberg Detection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stopLoss">Stop Loss (Optional)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="0.01"
                  value={formData.stopLoss}
                  onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                  placeholder="4320.00"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Trade rationale and observations..."
                />
              </div>

              <div className="col-span-2">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Add Trade
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Open Trades */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Open Positions ({openTrades.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openTrades.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No open positions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openTrades.map((trade) => (
                <div key={trade.id} className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={
                          trade.type === "Long"
                            ? "border-emerald-500/50 text-emerald-400"
                            : "border-red-500/50 text-red-400"
                        }
                      >
                        {trade.type === "Long" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {trade.type}
                      </Badge>
                      <span className="font-mono text-white">{trade.symbol}</span>
                      <span className="text-sm text-slate-400">{trade.strategy}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCloseTrade(trade.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Close
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Entry: </span>
                      <span className="font-mono text-blue-400">{trade.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Current: </span>
                      <span className="font-mono text-purple-400">{currentPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Qty: </span>
                      <span className="font-mono text-cyan-400">{trade.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">P&L: </span>
                      <span
                        className={`font-mono ${(trade.unrealizedPnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {(trade.unrealizedPnl || 0) >= 0 ? "+" : ""}${(trade.unrealizedPnl || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {trade.notes && (
                    <div className="mt-2 text-sm text-slate-300 bg-slate-700/30 p-2 rounded">{trade.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Closed Trades */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Recent Trades</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trades yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
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
                      <span className="font-mono text-white">{trade.symbol}</span>
                      <span className="text-sm text-slate-400">{trade.strategy}</span>
                      <Badge
                        variant="outline"
                        className={
                          trade.status === "Open"
                            ? "border-blue-500/50 text-blue-400"
                            : "border-slate-500/50 text-slate-400"
                        }
                      >
                        {trade.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {trade.status === "Closed" && trade.pnl !== undefined ? (
                        <span className={`font-mono ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span
                          className={`font-mono ${(trade.unrealizedPnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {(trade.unrealizedPnl || 0) >= 0 ? "+" : ""}${(trade.unrealizedPnl || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
