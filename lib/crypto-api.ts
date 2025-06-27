"use client"

// Cryptocurrency Exchange API Integration
// Supports: Bybit, KuCoin, Kraken, Crypto.com, CoinEx, Bitget

export interface CryptoMarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume24h: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  timestamp: number
}

export interface CryptoOrderRequest {
  symbol: string
  side: "BUY" | "SELL"
  type: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT"
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce?: "GTC" | "IOC" | "FOK"
  leverage?: number
  marginMode?: "ISOLATED" | "CROSS"
}

export interface CryptoPosition {
  symbol: string
  side: "LONG" | "SHORT"
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
  marginMode: string
  liquidationPrice?: number
}

export interface CryptoAccount {
  totalBalance: number
  availableBalance: number
  marginBalance: number
  unrealizedPnl: number
  totalMarginBalance: number
  totalWalletBalance: number
  positions: CryptoPosition[]
}

export interface CryptoExchangeConfig {
  name: string
  apiKey: string
  secretKey: string
  passphrase?: string // For some exchanges like KuCoin
  baseUrl: string
  testnet: boolean
  leverage?: number
}

class CryptoAPI {
  private config: CryptoExchangeConfig | null = null
  private websocket: WebSocket | null = null
  private marketDataCallbacks: ((data: CryptoMarketData) => void)[] = []
  private orderUpdateCallbacks: ((order: any) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  configure(config: CryptoExchangeConfig) {
    this.config = config
    this.reconnectAttempts = 0
  }

  async connectMarketData(symbols: string[]): Promise<void> {
    if (!this.config) {
      throw new Error("Crypto API not configured")
    }

    try {
      if (this.websocket) {
        this.websocket.close()
      }

      const wsUrl = this.getWebSocketUrl()
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log(`${this.config!.name} WebSocket connected`)
        this.reconnectAttempts = 0
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
        console.log(`${this.config!.name} WebSocket disconnected`)
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
      case "bybit":
        return this.config.testnet
          ? "wss://stream-testnet.bybit.com/v5/public/linear"
          : "wss://stream.bybit.com/v5/public/linear"

      case "kucoin":
        return this.config.testnet ? "wss://ws-api-sandbox.kucoin.com/" : "wss://ws-api-spot.kucoin.com/"

      case "kraken":
        return "wss://ws.kraken.com"

      case "crypto_com":
        return this.config.testnet ? "wss://uat-stream.3ona.co/v2/market" : "wss://stream.crypto.com/v2/market"

      case "coinex":
        return "wss://socket.coinex.com/"

      case "bitget":
        return this.config.testnet ? "wss://ws.bitgetapi.com/spot/v1/stream" : "wss://ws.bitgetapi.com/spot/v1/stream"

      default:
        throw new Error(`Unsupported exchange: ${this.config.name}`)
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
      case "bybit":
        return {
          op: "subscribe",
          args: symbols.map((symbol) => `tickers.${symbol}`),
        }

      case "kucoin":
        return {
          id: Date.now(),
          type: "subscribe",
          topic: "/market/ticker:all",
          privateChannel: false,
          response: true,
        }

      case "kraken":
        return {
          event: "subscribe",
          pair: symbols,
          subscription: { name: "ticker" },
        }

      case "crypto_com":
        return {
          method: "subscribe",
          params: {
            channels: symbols.map((symbol) => `ticker.${symbol}`),
          },
        }

      case "coinex":
        return {
          method: "state.subscribe",
          params: symbols,
          id: Date.now(),
        }

      case "bitget":
        return {
          op: "subscribe",
          args: symbols.map((symbol) => ({
            instType: "sp",
            channel: "ticker",
            instId: symbol,
          })),
        }

      default:
        throw new Error(`Unsupported exchange: ${this.config.name}`)
    }
  }

  private handleMarketDataMessage(data: any) {
    if (!this.config) return

    let marketData: CryptoMarketData | null = null

    switch (this.config.name) {
      case "bybit":
        marketData = this.parseBybitData(data)
        break
      case "kucoin":
        marketData = this.parseKuCoinData(data)
        break
      case "kraken":
        marketData = this.parseKrakenData(data)
        break
      case "crypto_com":
        marketData = this.parseCryptoComData(data)
        break
      case "coinex":
        marketData = this.parseCoinExData(data)
        break
      case "bitget":
        marketData = this.parseBitgetData(data)
        break
    }

    if (marketData) {
      this.marketDataCallbacks.forEach((callback) => callback(marketData!))
    }
  }

  private parseBybitData(data: any): CryptoMarketData | null {
    if (data.topic && data.topic.startsWith("tickers.") && data.data) {
      const ticker = data.data
      return {
        symbol: ticker.symbol,
        price: Number.parseFloat(ticker.lastPrice),
        bid: Number.parseFloat(ticker.bid1Price),
        ask: Number.parseFloat(ticker.ask1Price),
        volume24h: Number.parseFloat(ticker.volume24h),
        change24h: Number.parseFloat(ticker.price24hPcnt) * Number.parseFloat(ticker.lastPrice),
        changePercent24h: Number.parseFloat(ticker.price24hPcnt) * 100,
        high24h: Number.parseFloat(ticker.highPrice24h),
        low24h: Number.parseFloat(ticker.lowPrice24h),
        timestamp: Number.parseInt(ticker.time),
      }
    }
    return null
  }

  private parseKuCoinData(data: any): CryptoMarketData | null {
    if (data.type === "message" && data.topic === "/market/ticker:all" && data.data) {
      const ticker = data.data
      return {
        symbol: ticker.symbol,
        price: Number.parseFloat(ticker.price),
        bid: Number.parseFloat(ticker.bestBid),
        ask: Number.parseFloat(ticker.bestAsk),
        volume24h: Number.parseFloat(ticker.vol),
        change24h: Number.parseFloat(ticker.changePrice),
        changePercent24h: Number.parseFloat(ticker.changeRate) * 100,
        high24h: Number.parseFloat(ticker.high),
        low24h: Number.parseFloat(ticker.low),
        timestamp: ticker.time,
      }
    }
    return null
  }

  private parseKrakenData(data: any): CryptoMarketData | null {
    if (Array.isArray(data) && data[1] && data[2] === "ticker") {
      const ticker = data[1]
      const symbol = data[3]
      return {
        symbol: symbol,
        price: Number.parseFloat(ticker.c[0]),
        bid: Number.parseFloat(ticker.b[0]),
        ask: Number.parseFloat(ticker.a[0]),
        volume24h: Number.parseFloat(ticker.v[1]),
        change24h: Number.parseFloat(ticker.p[1]),
        changePercent24h: (Number.parseFloat(ticker.p[1]) / Number.parseFloat(ticker.c[0])) * 100,
        high24h: Number.parseFloat(ticker.h[1]),
        low24h: Number.parseFloat(ticker.l[1]),
        timestamp: Date.now(),
      }
    }
    return null
  }

  private parseCryptoComData(data: any): CryptoMarketData | null {
    if (data.method === "subscribe" && data.result && data.result.data) {
      const ticker = data.result.data
      return {
        symbol: ticker.i,
        price: Number.parseFloat(ticker.a),
        bid: Number.parseFloat(ticker.b),
        ask: Number.parseFloat(ticker.k),
        volume24h: Number.parseFloat(ticker.v),
        change24h: Number.parseFloat(ticker.c),
        changePercent24h: (Number.parseFloat(ticker.c) / Number.parseFloat(ticker.a)) * 100,
        high24h: Number.parseFloat(ticker.h),
        low24h: Number.parseFloat(ticker.l),
        timestamp: ticker.t,
      }
    }
    return null
  }

  private parseCoinExData(data: any): CryptoMarketData | null {
    if (data.method === "state.update" && data.params) {
      const symbol = data.params[0]
      const ticker = data.params[1]
      return {
        symbol: symbol,
        price: Number.parseFloat(ticker.last),
        bid: Number.parseFloat(ticker.bid),
        ask: Number.parseFloat(ticker.ask),
        volume24h: Number.parseFloat(ticker.vol),
        change24h: Number.parseFloat(ticker.change),
        changePercent24h: (Number.parseFloat(ticker.change) / Number.parseFloat(ticker.last)) * 100,
        high24h: Number.parseFloat(ticker.high),
        low24h: Number.parseFloat(ticker.low),
        timestamp: Date.now(),
      }
    }
    return null
  }

  private parseBitgetData(data: any): CryptoMarketData | null {
    if (data.action === "snapshot" && data.arg && data.data) {
      const ticker = data.data[0]
      return {
        symbol: data.arg.instId,
        price: Number.parseFloat(ticker.last),
        bid: Number.parseFloat(ticker.bidPx),
        ask: Number.parseFloat(ticker.askPx),
        volume24h: Number.parseFloat(ticker.baseVolume),
        change24h: Number.parseFloat(ticker.change24h),
        changePercent24h: Number.parseFloat(ticker.changeUtc24h) * 100,
        high24h: Number.parseFloat(ticker.high24h),
        low24h: Number.parseFloat(ticker.low24h),
        timestamp: Number.parseInt(ticker.ts),
      }
    }
    return null
  }

  private handleReconnection(symbols: string[]) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

      setTimeout(() => {
        this.connectMarketData(symbols)
      }, delay)
    } else {
      console.error("Max reconnection attempts reached")
    }
  }

  onMarketData(callback: (data: CryptoMarketData) => void) {
    this.marketDataCallbacks.push(callback)
  }

  onOrderUpdate(callback: (order: any) => void) {
    this.orderUpdateCallbacks.push(callback)
  }

  async placeOrder(order: CryptoOrderRequest): Promise<any> {
    if (!this.config) {
      throw new Error("Crypto API not configured")
    }

    try {
      const response = await this.makeApiRequest("POST", "/order", order)
      return response
    } catch (error) {
      console.error("Failed to place order:", error)
      throw error
    }
  }

  async getAccount(): Promise<CryptoAccount> {
    if (!this.config) {
      throw new Error("Crypto API not configured")
    }

    try {
      const response = await this.makeApiRequest("GET", "/account")
      return this.parseAccountResponse(response)
    } catch (error) {
      console.error("Failed to get account info:", error)
      throw error
    }
  }

  async getPositions(): Promise<CryptoPosition[]> {
    if (!this.config) {
      throw new Error("Crypto API not configured")
    }

    try {
      const response = await this.makeApiRequest("GET", "/positions")
      return this.parsePositionsResponse(response)
    } catch (error) {
      console.error("Failed to get positions:", error)
      throw error
    }
  }

  private async makeApiRequest(method: string, endpoint: string, body?: any): Promise<any> {
    if (!this.config) {
      throw new Error("Crypto API not configured")
    }

    const url = `${this.config.baseUrl}${endpoint}`
    const timestamp = Date.now().toString()
    const headers = this.getAuthHeaders(method, endpoint, timestamp, body)

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

  private getAuthHeaders(method: string, endpoint: string, timestamp: string, body?: any): Record<string, string> {
    if (!this.config) {
      throw new Error("Crypto API not configured")
    }

    // Each exchange has different authentication methods
    // This is a simplified version - real implementation would need proper HMAC signatures
    switch (this.config.name) {
      case "bybit":
        return {
          "X-BAPI-API-KEY": this.config.apiKey,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": "5000",
        }

      case "kucoin":
        return {
          "KC-API-KEY": this.config.apiKey,
          "KC-API-TIMESTAMP": timestamp,
          "KC-API-PASSPHRASE": this.config.passphrase || "",
        }

      case "kraken":
        return {
          "API-Key": this.config.apiKey,
        }

      case "crypto_com":
        return {
          "X-CRO-API-KEY": this.config.apiKey,
        }

      case "coinex":
        return {
          AccessId: this.config.apiKey,
          Tonce: timestamp,
        }

      case "bitget":
        return {
          "ACCESS-KEY": this.config.apiKey,
          "ACCESS-TIMESTAMP": timestamp,
        }

      default:
        throw new Error(`Unsupported exchange: ${this.config.name}`)
    }
  }

  private parseAccountResponse(response: any): CryptoAccount {
    // Simplified parsing - each exchange has different response formats
    return {
      totalBalance: Number.parseFloat(response.totalBalance || response.total || 0),
      availableBalance: Number.parseFloat(response.availableBalance || response.available || 0),
      marginBalance: Number.parseFloat(response.marginBalance || 0),
      unrealizedPnl: Number.parseFloat(response.unrealizedPnl || 0),
      totalMarginBalance: Number.parseFloat(response.totalMarginBalance || 0),
      totalWalletBalance: Number.parseFloat(response.totalWalletBalance || 0),
      positions: [],
    }
  }

  private parsePositionsResponse(response: any[]): CryptoPosition[] {
    return response.map((pos) => ({
      symbol: pos.symbol,
      side: pos.side,
      size: Number.parseFloat(pos.size || pos.quantity),
      entryPrice: Number.parseFloat(pos.entryPrice || pos.avgPrice),
      markPrice: Number.parseFloat(pos.markPrice || pos.currentPrice),
      unrealizedPnl: Number.parseFloat(pos.unrealizedPnl || 0),
      leverage: Number.parseFloat(pos.leverage || 1),
      marginMode: pos.marginMode || "CROSS",
      liquidationPrice: Number.parseFloat(pos.liquidationPrice || 0),
    }))
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.marketDataCallbacks = []
    this.orderUpdateCallbacks = []
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN
  }
}

export const cryptoAPI = new CryptoAPI()
