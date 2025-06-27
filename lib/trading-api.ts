"use client"

// Trading API Integration Layer
// Supports multiple brokers: Interactive Brokers, TD Ameritrade, Alpaca, etc.

export interface MarketDataTick {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  timestamp: number
  change: number
  changePercent: number
}

export interface OrderRequest {
  symbol: string
  side: "BUY" | "SELL"
  quantity: number
  orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT"
  price?: number
  stopPrice?: number
  timeInForce: "DAY" | "GTC" | "IOC" | "FOK"
  strategy?: string
  notes?: string
}

export interface Position {
  symbol: string
  quantity: number
  avgPrice: number
  marketValue: number
  unrealizedPnL: number
  realizedPnL: number
  side: "LONG" | "SHORT"
}

export interface Account {
  accountId: string
  totalValue: number
  buyingPower: number
  dayTradingBuyingPower: number
  equity: number
  cash: number
  marginUsed: number
  dayTradeCount: number
  patternDayTrader: boolean
}

export interface OrderStatus {
  orderId: string
  symbol: string
  side: "BUY" | "SELL"
  quantity: number
  filledQuantity: number
  avgFillPrice: number
  status: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED"
  orderType: string
  timeInForce: string
  submittedAt: string
  filledAt?: string
  canceledAt?: string
}

export interface BrokerConfig {
  name: string
  apiKey: string
  secretKey?: string
  baseUrl: string
  sandbox: boolean
  accountId?: string
}

class TradingAPI {
  private config: BrokerConfig | null = null
  private websocket: WebSocket | null = null
  private marketDataCallbacks: ((data: MarketDataTick) => void)[] = []
  private orderUpdateCallbacks: ((order: OrderStatus) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  // Configure broker connection
  configure(config: BrokerConfig) {
    this.config = config
    this.reconnectAttempts = 0
  }

  // Connect to real-time market data
  async connectMarketData(symbols: string[]): Promise<void> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    try {
      // Close existing connection
      if (this.websocket) {
        this.websocket.close()
      }

      const wsUrl = this.getWebSocketUrl()
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log("Market data WebSocket connected")
        this.reconnectAttempts = 0

        // Subscribe to symbols
        this.subscribeToSymbols(symbols)
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMarketDataMessage(data)
        } catch (error) {
          console.error("Error parsing market data:", error)
        }
      }

      this.websocket.onclose = () => {
        console.log("Market data WebSocket disconnected")
        this.handleReconnection(symbols)
      }

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error)
      }
    } catch (error) {
      console.error("Failed to connect to market data:", error)
      throw error
    }
  }

  private getWebSocketUrl(): string {
    if (!this.config) throw new Error("No configuration")

    switch (this.config.name) {
      case "alpaca":
        return this.config.sandbox
          ? "wss://stream.data.sandbox.alpaca.markets/v2/iex"
          : "wss://stream.data.alpaca.markets/v2/iex"

      case "polygon":
        return this.config.sandbox ? "wss://socket.polygon.io/stocks" : "wss://socket.polygon.io/stocks"

      case "finnhub":
        return "wss://ws.finnhub.io"

      default:
        throw new Error(`Unsupported broker: ${this.config.name}`)
    }
  }

  private subscribeToSymbols(symbols: string[]) {
    if (!this.websocket || !this.config) return

    const subscriptionMessage = this.createSubscriptionMessage(symbols)
    this.websocket.send(JSON.stringify(subscriptionMessage))
  }

  private createSubscriptionMessage(symbols: string[]) {
    if (!this.config) throw new Error("No configuration")

    switch (this.config.name) {
      case "alpaca":
        return {
          action: "auth",
          key: this.config.apiKey,
          secret: this.config.secretKey,
        }

      case "polygon":
        return {
          action: "auth",
          params: this.config.apiKey,
        }

      case "finnhub":
        return {
          type: "subscribe",
          symbol: symbols.join(","),
        }

      default:
        throw new Error(`Unsupported broker: ${this.config.name}`)
    }
  }

  private handleMarketDataMessage(data: any) {
    if (!this.config) return

    let marketTick: MarketDataTick | null = null

    switch (this.config.name) {
      case "alpaca":
        marketTick = this.parseAlpacaData(data)
        break

      case "polygon":
        marketTick = this.parsePolygonData(data)
        break

      case "finnhub":
        marketTick = this.parseFinnhubData(data)
        break
    }

    if (marketTick) {
      this.marketDataCallbacks.forEach((callback) => callback(marketTick!))
    }
  }

  private parseAlpacaData(data: any): MarketDataTick | null {
    if (data.T === "t") {
      // Trade data
      return {
        symbol: data.S,
        price: data.p,
        bid: data.p - 0.01, // Approximate
        ask: data.p + 0.01, // Approximate
        volume: data.s,
        timestamp: new Date(data.t).getTime(),
        change: 0, // Calculate separately
        changePercent: 0, // Calculate separately
      }
    }
    return null
  }

  private parsePolygonData(data: any): MarketDataTick | null {
    if (data.ev === "T") {
      // Trade event
      return {
        symbol: data.sym,
        price: data.p,
        bid: data.p - 0.01,
        ask: data.p + 0.01,
        volume: data.s,
        timestamp: data.t,
        change: 0,
        changePercent: 0,
      }
    }
    return null
  }

  private parseFinnhubData(data: any): MarketDataTick | null {
    if (data.type === "trade") {
      return {
        symbol: data.s,
        price: data.p,
        bid: data.p - 0.01,
        ask: data.p + 0.01,
        volume: data.v,
        timestamp: data.t,
        change: 0,
        changePercent: 0,
      }
    }
    return null
  }

  private handleReconnection(symbols: string[]) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000 // Exponential backoff

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

      setTimeout(() => {
        this.connectMarketData(symbols)
      }, delay)
    } else {
      console.error("Max reconnection attempts reached")
    }
  }

  // Subscribe to market data updates
  onMarketData(callback: (data: MarketDataTick) => void) {
    this.marketDataCallbacks.push(callback)
  }

  // Subscribe to order updates
  onOrderUpdate(callback: (order: OrderStatus) => void) {
    this.orderUpdateCallbacks.push(callback)
  }

  // Place a new order
  async placeOrder(order: OrderRequest): Promise<OrderStatus> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    try {
      const response = await this.makeApiRequest("POST", "/orders", order)
      return this.parseOrderResponse(response)
    } catch (error) {
      console.error("Failed to place order:", error)
      throw error
    }
  }

  // Cancel an existing order
  async cancelOrder(orderId: string): Promise<void> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    try {
      await this.makeApiRequest("DELETE", `/orders/${orderId}`)
    } catch (error) {
      console.error("Failed to cancel order:", error)
      throw error
    }
  }

  // Get account information
  async getAccount(): Promise<Account> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    try {
      const response = await this.makeApiRequest("GET", "/account")
      return this.parseAccountResponse(response)
    } catch (error) {
      console.error("Failed to get account info:", error)
      throw error
    }
  }

  // Get current positions
  async getPositions(): Promise<Position[]> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    try {
      const response = await this.makeApiRequest("GET", "/positions")
      return this.parsePositionsResponse(response)
    } catch (error) {
      console.error("Failed to get positions:", error)
      throw error
    }
  }

  // Get order history
  async getOrders(status?: string): Promise<OrderStatus[]> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    try {
      const url = status ? `/orders?status=${status}` : "/orders"
      const response = await this.makeApiRequest("GET", url)
      return this.parseOrdersResponse(response)
    } catch (error) {
      console.error("Failed to get orders:", error)
      throw error
    }
  }

  private async makeApiRequest(method: string, endpoint: string, body?: any): Promise<any> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    const url = `${this.config.baseUrl}${endpoint}`
    const headers = this.getAuthHeaders()

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.config) {
      throw new Error("Trading API not configured")
    }

    switch (this.config.name) {
      case "alpaca":
        return {
          "APCA-API-KEY-ID": this.config.apiKey,
          "APCA-API-SECRET-KEY": this.config.secretKey || "",
        }

      case "polygon":
        return {
          Authorization: `Bearer ${this.config.apiKey}`,
        }

      case "finnhub":
        return {
          "X-Finnhub-Token": this.config.apiKey,
        }

      default:
        throw new Error(`Unsupported broker: ${this.config.name}`)
    }
  }

  private parseOrderResponse(response: any): OrderStatus {
    // Parse based on broker format
    return {
      orderId: response.id || response.order_id,
      symbol: response.symbol,
      side: response.side,
      quantity: response.qty || response.quantity,
      filledQuantity: response.filled_qty || response.filled_quantity || 0,
      avgFillPrice: response.filled_avg_price || response.avg_fill_price || 0,
      status: response.status,
      orderType: response.order_type || response.type,
      timeInForce: response.time_in_force,
      submittedAt: response.submitted_at || response.created_at,
      filledAt: response.filled_at,
      canceledAt: response.canceled_at,
    }
  }

  private parseAccountResponse(response: any): Account {
    return {
      accountId: response.account_number || response.id,
      totalValue: Number.parseFloat(response.portfolio_value || response.equity),
      buyingPower: Number.parseFloat(response.buying_power),
      dayTradingBuyingPower: Number.parseFloat(response.daytrading_buying_power || response.buying_power),
      equity: Number.parseFloat(response.equity || response.portfolio_value),
      cash: Number.parseFloat(response.cash),
      marginUsed: Number.parseFloat(response.initial_margin || 0),
      dayTradeCount: Number.parseInt(response.daytrade_count || 0),
      patternDayTrader: response.pattern_day_trader || false,
    }
  }

  private parsePositionsResponse(response: any[]): Position[] {
    return response.map((pos) => ({
      symbol: pos.symbol,
      quantity: Number.parseInt(pos.qty || pos.quantity),
      avgPrice: Number.parseFloat(pos.avg_entry_price || pos.avg_price),
      marketValue: Number.parseFloat(pos.market_value),
      unrealizedPnL: Number.parseFloat(pos.unrealized_pl || pos.unrealized_pnl),
      realizedPnL: Number.parseFloat(pos.realized_pl || pos.realized_pnl || 0),
      side: Number.parseInt(pos.qty || pos.quantity) > 0 ? "LONG" : "SHORT",
    }))
  }

  private parseOrdersResponse(response: any[]): OrderStatus[] {
    return response.map((order) => this.parseOrderResponse(order))
  }

  // Disconnect from all services
  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.marketDataCallbacks = []
    this.orderUpdateCallbacks = []
  }

  // Get connection status
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN
  }
}

export const tradingAPI = new TradingAPI()
