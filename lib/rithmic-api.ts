"use client"

// Rithmic API Integration for Professional Futures Trading
// Supports real-time market data, order management, and account information

export interface RithmicConfig {
  username: string
  password: string
  systemName: string
  appName: string
  appVersion: string
  environment: "test" | "live"
  gateway: string
}

export interface RithmicMarketData {
  symbol: string
  exchange: string
  lastPrice: number
  bidPrice: number
  askPrice: number
  bidSize: number
  askSize: number
  volume: number
  openPrice: number
  highPrice: number
  lowPrice: number
  settlementPrice: number
  timestamp: number
}

export interface RithmicOrderRequest {
  symbol: string
  exchange: string
  side: "BUY" | "SELL"
  quantity: number
  orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT"
  price?: number
  stopPrice?: number
  timeInForce: "DAY" | "GTC" | "IOC" | "FOK"
  account?: string
}

export interface RithmicPosition {
  symbol: string
  exchange: string
  netPosition: number
  avgPrice: number
  unrealizedPnL: number
  realizedPnL: number
}

export interface RithmicAccount {
  accountId: string
  netLiquidationValue: number
  totalCashValue: number
  buyingPower: number
  maintenanceMargin: number
  initialMargin: number
  availableFunds: number
  excessLiquidity: number
}

class RithmicAPI {
  private config: RithmicConfig | null = null
  private websocket: WebSocket | null = null
  private accountUpdateCallbacks: ((account: RithmicAccount) => void)[] = []
  private marketDataCallbacks: ((data: RithmicMarketData) => void)[] = []
  private orderUpdateCallbacks: ((order: any) => void)[] = []
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  configure(config: RithmicConfig) {
    this.config = config
    this.reconnectAttempts = 0
  }

  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error("Rithmic API not configured")
    }

    try {
      // Close existing connection
      if (this.websocket) {
        this.websocket.close()
      }

      // Connect to Rithmic gateway
      const wsUrl = this.getWebSocketUrl()
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log("Rithmic WebSocket connected")
        this.authenticate()
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = this.parseMessage(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error("Error parsing Rithmic message:", error)
        }
      }

      this.websocket.onclose = () => {
        console.log("Rithmic WebSocket disconnected")
        this.connected = false
        this.handleReconnection()
      }

      this.websocket.onerror = (error) => {
        console.error("Rithmic WebSocket error:", error)
      }
    } catch (error) {
      console.error("Failed to connect to Rithmic:", error)
      throw error
    }
  }

  private getWebSocketUrl(): string {
    if (!this.config) throw new Error("No configuration")

    // Rithmic uses different URLs based on environment and gateway
    const baseUrl =
      this.config.environment === "test" ? "wss://rituz00100.rithmic.com:443" : "wss://rituz00100.rithmic.com:443"

    return `${baseUrl}/${this.config.gateway}`
  }

  private authenticate() {
    if (!this.websocket || !this.config) return

    const loginMessage = {
      template_id: 10, // Login request
      user_msg: [
        this.config.username,
        this.config.password,
        this.config.systemName,
        this.config.appName,
        this.config.appVersion,
      ],
    }

    this.sendMessage(loginMessage)
  }

  private parseMessage(data: string | ArrayBuffer): any {
    // Rithmic uses binary protocol, this is a simplified version
    if (typeof data === "string") {
      return JSON.parse(data)
    } else {
      // Handle binary data parsing
      const view = new DataView(data)
      const templateId = view.getUint16(0, true)

      return {
        template_id: templateId,
        data: data,
      }
    }
  }

  private handleMessage(message: any) {
    switch (message.template_id) {
      case 11: // Login response
        this.handleLoginResponse(message)
        break
      case 150: // Market data update
        this.handleMarketDataUpdate(message)
        break
      case 101: // Account update
        this.handleAccountUpdate(message)
        break
      case 102: // Order update
        this.handleOrderUpdate(message)
        break
      case 103: // Position update
        this.handlePositionUpdate(message)
        break
      default:
        console.log("Unknown message type:", message.template_id)
    }
  }

  private handleLoginResponse(message: any) {
    if (message.rp_code && message.rp_code[0] === "0") {
      console.log("Rithmic login successful")
      this.connected = true
      this.reconnectAttempts = 0

      // Request account information
      this.requestAccountInfo()
    } else {
      console.error("Rithmic login failed:", message.rp_code)
      throw new Error("Authentication failed")
    }
  }

  private handleMarketDataUpdate(message: any) {
    // Parse market data from Rithmic format
    const marketData: RithmicMarketData = {
      symbol: message.symbol || "",
      exchange: message.exchange || "",
      lastPrice: Number.parseFloat(message.last_trade_price || 0),
      bidPrice: Number.parseFloat(message.best_bid_price || 0),
      askPrice: Number.parseFloat(message.best_ask_price || 0),
      bidSize: Number.parseInt(message.best_bid_quantity || 0),
      askSize: Number.parseInt(message.best_ask_quantity || 0),
      volume: Number.parseInt(message.total_volume || 0),
      openPrice: Number.parseFloat(message.open_price || 0),
      highPrice: Number.parseFloat(message.high_price || 0),
      lowPrice: Number.parseFloat(message.low_price || 0),
      settlementPrice: Number.parseFloat(message.settlement_price || 0),
      timestamp: Date.now(),
    }

    this.marketDataCallbacks.forEach((callback) => callback(marketData))
  }

  private handleAccountUpdate(message: any) {
    const account: RithmicAccount = {
      accountId: message.account_id || "",
      netLiquidationValue: Number.parseFloat(message.net_liquidation_value || 0),
      totalCashValue: Number.parseFloat(message.total_cash_value || 0),
      buyingPower: Number.parseFloat(message.buying_power || 0),
      maintenanceMargin: Number.parseFloat(message.maintenance_margin || 0),
      initialMargin: Number.parseFloat(message.initial_margin || 0),
      availableFunds: Number.parseFloat(message.available_funds || 0),
      excessLiquidity: Number.parseFloat(message.excess_liquidity || 0),
    }

    this.accountUpdateCallbacks.forEach((callback) => callback(account))
  }

  private handleOrderUpdate(message: any) {
    this.orderUpdateCallbacks.forEach((callback) => callback(message))
  }

  private handlePositionUpdate(message: any) {
    // Handle position updates
    console.log("Position update:", message)
  }

  private requestAccountInfo() {
    const accountRequest = {
      template_id: 200, // Account info request
      user_msg: [],
    }

    this.sendMessage(accountRequest)
  }

  async subscribeMarketData(symbol: string, exchange: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Not connected to Rithmic")
    }

    const subscribeMessage = {
      template_id: 100, // Market data subscription
      user_msg: [symbol, exchange],
    }

    this.sendMessage(subscribeMessage)
  }

  async placeOrder(order: RithmicOrderRequest): Promise<any> {
    if (!this.connected) {
      throw new Error("Not connected to Rithmic")
    }

    const orderMessage = {
      template_id: 300, // New order
      user_msg: [
        order.symbol,
        order.exchange,
        order.side,
        order.quantity.toString(),
        order.orderType,
        order.price?.toString() || "",
        order.stopPrice?.toString() || "",
        order.timeInForce,
        order.account || "",
      ],
    }

    this.sendMessage(orderMessage)

    return { orderId: Date.now().toString() } // Simplified response
  }

  async cancelOrder(orderId: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Not connected to Rithmic")
    }

    const cancelMessage = {
      template_id: 301, // Cancel order
      user_msg: [orderId],
    }

    this.sendMessage(cancelMessage)
  }

  private sendMessage(message: any) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      // In real implementation, this would be binary encoding
      this.websocket.send(JSON.stringify(message))
    }
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000

      console.log(`Attempting to reconnect to Rithmic in ${delay}ms (attempt ${this.reconnectAttempts})`)

      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error("Max Rithmic reconnection attempts reached")
    }
  }

  onAccountUpdate(callback: (account: RithmicAccount) => void) {
    this.accountUpdateCallbacks.push(callback)
  }

  onMarketData(callback: (data: RithmicMarketData) => void) {
    this.marketDataCallbacks.push(callback)
  }

  onOrderUpdate(callback: (order: any) => void) {
    this.orderUpdateCallbacks.push(callback)
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.connected = false
    this.accountUpdateCallbacks = []
    this.marketDataCallbacks = []
    this.orderUpdateCallbacks = []
  }

  isConnected(): boolean {
    return this.connected
  }
}

export const rithmicAPI = new RithmicAPI()
