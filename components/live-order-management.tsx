"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { tradingAPI, type OrderRequest, type OrderStatus, type Position } from "@/lib/trading-api"
import { ORDER_TYPES, TIME_IN_FORCE, SUPPORTED_SYMBOLS } from "@/lib/broker-configs"
import { useTradeStore } from "@/lib/trade-store"
import { Plus, X, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface LiveOrderManagementProps {
  connected: boolean
}

export function LiveOrderManagement({ connected }: LiveOrderManagementProps) {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orders, setOrders] = useState<OrderStatus[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  const { addTrade } = useTradeStore()

  const [orderForm, setOrderForm] = useState<OrderRequest>({
    symbol: "ES",
    side: "BUY",
    quantity: 1,
    orderType: "MARKET",
    timeInForce: "DAY",
    strategy: "Live Trading",
  })

  useEffect(() => {
    if (!connected) {
      setOrders([])
      setPositions([])
      return
    }

    // Load initial data
    loadOrders()
    loadPositions()

    // Subscribe to order updates
    const handleOrderUpdate = (order: OrderStatus) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o.orderId === order.orderId)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = order
          return updated
        } else {
          return [order, ...prev]
        }
      })

      // Add to trade store if filled
      if (order.status === "FILLED") {
        addTrade({
          symbol: order.symbol,
          type: order.side === "BUY" ? "Long" : "Short",
          status: "Open",
          entryPrice: order.avgFillPrice,
          quantity: order.filledQuantity,
          strategy: "Live Trading",
          notes: `Live order ${order.orderId}`,
        })
      }
    }

    tradingAPI.onOrderUpdate(handleOrderUpdate)

    // Refresh data periodically
    const interval = setInterval(() => {
      loadOrders()
      loadPositions()
    }, 10000)

    return () => clearInterval(interval)
  }, [connected, addTrade])

  const loadOrders = async () => {
    try {
      const orderData = await tradingAPI.getOrders()
      setOrders(orderData.slice(0, 20)) // Show last 20 orders
    } catch (error) {
      console.error("Failed to load orders:", error)
    }
  }

  const loadPositions = async () => {
    try {
      const positionData = await tradingAPI.getPositions()
      setPositions(positionData)
    } catch (error) {
      console.error("Failed to load positions:", error)
    }
  }

  const handleSubmitOrder = async () => {
    setSubmittingOrder(true)
    setOrderError(null)

    try {
      const order = await tradingAPI.placeOrder(orderForm)

      // Reset form
      setOrderForm({
        symbol: "ES",
        side: "BUY",
        quantity: 1,
        orderType: "MARKET",
        timeInForce: "DAY",
        strategy: "Live Trading",
      })
      setShowOrderForm(false)

      // Refresh orders
      await loadOrders()
    } catch (error) {
      console.error("Failed to place order:", error)
      setOrderError(error instanceof Error ? error.message : "Failed to place order")
    } finally {
      setSubmittingOrder(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await tradingAPI.cancelOrder(orderId)
      await loadOrders()
    } catch (error) {
      console.error("Failed to cancel order:", error)
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "FILLED":
        return "border-emerald-500/50 text-emerald-400"
      case "PARTIALLY_FILLED":
        return "border-yellow-500/50 text-yellow-400"
      case "CANCELED":
      case "REJECTED":
        return "border-red-500/50 text-red-400"
      default:
        return "border-blue-500/50 text-blue-400"
    }
  }

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "FILLED":
        return <CheckCircle className="w-4 h-4" />
      case "PARTIALLY_FILLED":
        return <Clock className="w-4 h-4" />
      case "CANCELED":
      case "REJECTED":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!connected) {
    return (
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            <span>Live Order Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Connect to a broker to manage live orders</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Order Form */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Place Live Order</span>
            </div>
            <Button
              onClick={() => setShowOrderForm(!showOrderForm)}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              {showOrderForm ? "Cancel" : "New Order"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showOrderForm && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Select
                  value={orderForm.symbol}
                  onValueChange={(value) => setOrderForm({ ...orderForm, symbol: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_SYMBOLS.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="side">Side</Label>
                <Select
                  value={orderForm.side}
                  onValueChange={(value: "BUY" | "SELL") => setOrderForm({ ...orderForm, side: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: Number.parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="orderType">Order Type</Label>
                <Select
                  value={orderForm.orderType}
                  onValueChange={(value: any) => setOrderForm({ ...orderForm, orderType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(orderForm.orderType === "LIMIT" || orderForm.orderType === "STOP_LIMIT") && (
                <div>
                  <Label htmlFor="price">Limit Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={orderForm.price || ""}
                    onChange={(e) => setOrderForm({ ...orderForm, price: Number.parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              )}

              {(orderForm.orderType === "STOP" || orderForm.orderType === "STOP_LIMIT") && (
                <div>
                  <Label htmlFor="stopPrice">Stop Price</Label>
                  <Input
                    id="stopPrice"
                    type="number"
                    step="0.01"
                    value={orderForm.stopPrice || ""}
                    onChange={(e) => setOrderForm({ ...orderForm, stopPrice: Number.parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="timeInForce">Time in Force</Label>
                <Select
                  value={orderForm.timeInForce}
                  onValueChange={(value: any) => setOrderForm({ ...orderForm, timeInForce: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_IN_FORCE.map((tif) => (
                      <SelectItem key={tif.value} value={tif.value}>
                        {tif.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {orderError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Order Failed</span>
                </div>
                <p className="text-sm text-slate-300 mt-1">{orderError}</p>
              </div>
            )}

            <Button
              onClick={handleSubmitOrder}
              disabled={submittingOrder}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              {submittingOrder ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Placing Order...
                </>
              ) : (
                `Place ${orderForm.side} Order`
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Live Positions */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>Live Positions ({positions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No open positions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => (
                <div key={index} className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={
                          position.side === "LONG"
                            ? "border-emerald-500/50 text-emerald-400"
                            : "border-red-500/50 text-red-400"
                        }
                      >
                        {position.side === "LONG" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {position.side}
                      </Badge>
                      <span className="font-mono text-white">{position.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono ${position.unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {position.unrealizedPnL >= 0 ? "+" : ""}${position.unrealizedPnL.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Quantity: </span>
                      <span className="font-mono text-cyan-400">{Math.abs(position.quantity)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg Price: </span>
                      <span className="font-mono text-blue-400">${position.avgPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Market Value: </span>
                      <span className="font-mono text-purple-400">${position.marketValue.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Realized P&L: </span>
                      <span className={`font-mono ${position.realizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ${position.realizedPnL.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Orders */}
      <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span>Live Orders ({orders.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.orderId} className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getOrderStatusColor(order.status)}>
                        {getOrderStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                      <span className="font-mono text-white">{order.symbol}</span>
                      <span className="text-sm text-slate-400">
                        {order.side} {order.quantity}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {order.status === "NEW" || order.status === "PARTIALLY_FILLED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelOrder(order.orderId)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Order Type: </span>
                      <span className="text-blue-400">{order.orderType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Filled: </span>
                      <span className="text-emerald-400">
                        {order.filledQuantity}/{order.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg Fill: </span>
                      <span className="text-purple-400">
                        {order.avgFillPrice > 0 ? `$${order.avgFillPrice.toFixed(2)}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-2">
                    Submitted: {new Date(order.submittedAt).toLocaleString()}
                    {order.filledAt && (
                      <span className="ml-4">Filled: {new Date(order.filledAt).toLocaleString()}</span>
                    )}
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
