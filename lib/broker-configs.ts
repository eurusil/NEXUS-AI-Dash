"use client"

import type { BrokerConfig } from "./trading-api"
import type { CryptoExchangeConfig } from "./crypto-api"

export const BROKER_CONFIGS: Record<string, Omit<BrokerConfig, "apiKey" | "secretKey">> = {
  alpaca: {
    name: "alpaca",
    baseUrl: "https://paper-api.alpaca.markets/v2", // Sandbox
    sandbox: true,
  },

  alpaca_live: {
    name: "alpaca",
    baseUrl: "https://api.alpaca.markets/v2", // Live
    sandbox: false,
  },

  polygon: {
    name: "polygon",
    baseUrl: "https://api.polygon.io/v2",
    sandbox: false,
  },

  finnhub: {
    name: "finnhub",
    baseUrl: "https://finnhub.io/api/v1",
    sandbox: false,
  },

  interactive_brokers: {
    name: "interactive_brokers",
    baseUrl: "https://localhost:5000/v1/api", // IB Gateway
    sandbox: false,
  },

  td_ameritrade: {
    name: "td_ameritrade",
    baseUrl: "https://api.tdameritrade.com/v1",
    sandbox: false,
  },

  rithmic: {
    name: "rithmic",
    baseUrl: "wss://rituz00100.rithmic.com:443", // Rithmic Gateway
    sandbox: false,
  },

  rithmic_test: {
    name: "rithmic",
    baseUrl: "wss://rituz00100.rithmic.com:443", // Rithmic Test
    sandbox: true,
  },
}

export const CRYPTO_CONFIGS: Record<string, Omit<CryptoExchangeConfig, "apiKey" | "secretKey" | "passphrase">> = {
  bybit: {
    name: "bybit",
    baseUrl: "https://api.bybit.com",
    testnet: false,
  },

  bybit_testnet: {
    name: "bybit",
    baseUrl: "https://api-testnet.bybit.com",
    testnet: true,
  },

  kucoin: {
    name: "kucoin",
    baseUrl: "https://api.kucoin.com",
    testnet: false,
  },

  kucoin_sandbox: {
    name: "kucoin",
    baseUrl: "https://openapi-sandbox.kucoin.com",
    testnet: true,
  },

  kraken: {
    name: "kraken",
    baseUrl: "https://api.kraken.com",
    testnet: false,
  },

  crypto_com: {
    name: "crypto_com",
    baseUrl: "https://api.crypto.com/v2",
    testnet: false,
  },

  crypto_com_sandbox: {
    name: "crypto_com",
    baseUrl: "https://uat-api.3ona.co/v2",
    testnet: true,
  },

  coinex: {
    name: "coinex",
    baseUrl: "https://api.coinex.com",
    testnet: false,
  },

  bitget: {
    name: "bitget",
    baseUrl: "https://api.bitget.com",
    testnet: false,
  },

  bitget_sandbox: {
    name: "bitget",
    baseUrl: "https://api.bitgetapi.com",
    testnet: true,
  },
}

export const SUPPORTED_SYMBOLS = [
  // Futures - Rithmic specializes in these
  "ESM4",
  "ESU4",
  "ESZ4",
  "ESH5", // E-mini S&P 500
  "NQM4",
  "NQU4",
  "NQZ4",
  "NQH5", // E-mini Nasdaq
  "RTY",
  "RTYM4",
  "RTYU4", // E-mini Russell
  "YM",
  "YMM4",
  "YMU4", // E-mini Dow
  "CL",
  "CLM4",
  "CLU4", // Crude Oil
  "GC",
  "GCM4",
  "GCZ4", // Gold
  "SI",
  "SIM4",
  "SIU4", // Silver
  "NG",
  "NGM4",
  "NGU4", // Natural Gas
  "ZB",
  "ZBM4",
  "ZBU4", // 30-Year Treasury Bond
  "ZN",
  "ZNM4",
  "ZNU4", // 10-Year Treasury Note
  "ZF",
  "ZFM4",
  "ZFU4", // 5-Year Treasury Note
  "6E",
  "6EM4",
  "6EU4", // Euro FX
  "6B",
  "6BM4",
  "6BU4", // British Pound
  "6J",
  "6JM4",
  "6JU4", // Japanese Yen
  "6A",
  "6AM4",
  "6AU4", // Australian Dollar

  // Legacy symbols for compatibility
  "ES",
  "NQ",
  "RTY",
  "YM",

  // Stocks (if supported by broker)
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "TSLA",
  "NVDA",
  "META",
  "NFLX",
  "AMD",
  "INTC",

  // Forex (if supported)
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",

  // Major Cryptocurrencies
  "BTC/USDT",
  "ETH/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "SOL/USDT",
  "DOGE/USDT",
  "DOT/USDT",
  "MATIC/USDT",
  "SHIB/USDT",
  "AVAX/USDT",
  "UNI/USDT",
  "LINK/USDT",
  "ATOM/USDT",
  "LTC/USDT",
  "BCH/USDT",
  "FIL/USDT",
  "TRX/USDT",
  "ETC/USDT",
  "XLM/USDT",

  // Crypto USD pairs
  "BTC/USD",
  "ETH/USD",
  "BNB/USD",
  "XRP/USD",
  "ADA/USD",
  "SOL/USD",
  "DOGE/USD",
  "DOT/USD",
  "MATIC/USD",
  "AVAX/USD",

  // Popular altcoins
  "NEAR/USDT",
  "ALGO/USDT",
  "VET/USDT",
  "ICP/USDT",
  "HBAR/USDT",
  "FLOW/USDT",
  "MANA/USDT",
  "SAND/USDT",
  "CRO/USDT",
  "FTM/USDT",
]

export const CRYPTO_SYMBOLS = [
  // Major pairs
  "BTC/USDT",
  "ETH/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "SOL/USDT",
  "DOGE/USDT",
  "DOT/USDT",
  "MATIC/USDT",
  "SHIB/USDT",
  "AVAX/USDT",
  "UNI/USDT",
  "LINK/USDT",
  "ATOM/USDT",
  "LTC/USDT",
  "BCH/USDT",
  "FIL/USDT",
  "TRX/USDT",
  "ETC/USDT",
  "XLM/USDT",
  "NEAR/USDT",
  "ALGO/USDT",
  "VET/USDT",
  "ICP/USDT",
  "HBAR/USDT",
  "FLOW/USDT",
  "MANA/USDT",
  "SAND/USDT",
  "CRO/USDT",
  "FTM/USDT",

  // USD pairs
  "BTC/USD",
  "ETH/USD",
  "BNB/USD",
  "XRP/USD",
  "ADA/USD",
  "SOL/USD",
  "DOGE/USD",
  "DOT/USD",
  "MATIC/USD",
  "AVAX/USD",

  // BTC pairs
  "ETH/BTC",
  "BNB/BTC",
  "XRP/BTC",
  "ADA/BTC",
  "SOL/BTC",
  "DOT/BTC",
  "LINK/BTC",
  "LTC/BTC",
  "BCH/BTC",
  "UNI/BTC",
]

export const RITHMIC_EXCHANGES = [
  { value: "CME", label: "Chicago Mercantile Exchange" },
  { value: "CBOT", label: "Chicago Board of Trade" },
  { value: "NYMEX", label: "New York Mercantile Exchange" },
  { value: "COMEX", label: "Commodity Exchange" },
  { value: "ICE", label: "Intercontinental Exchange" },
  { value: "EUREX", label: "Eurex Exchange" },
]

export const CRYPTO_EXCHANGES = [
  { value: "bybit", label: "Bybit", description: "Leading derivatives exchange" },
  { value: "kucoin", label: "KuCoin", description: "People's Exchange" },
  { value: "kraken", label: "Kraken", description: "Trusted crypto exchange" },
  { value: "crypto_com", label: "Crypto.com", description: "Premier crypto platform" },
  { value: "coinex", label: "CoinEx", description: "Global crypto exchange" },
  { value: "bitget", label: "Bitget", description: "Copy trading leader" },
]

export const ORDER_TYPES = [
  { value: "MARKET", label: "Market Order" },
  { value: "LIMIT", label: "Limit Order" },
  { value: "STOP", label: "Stop Order" },
  { value: "STOP_LIMIT", label: "Stop Limit Order" },
  { value: "MIT", label: "Market If Touched" },
  { value: "LIT", label: "Limit If Touched" },
]

export const TIME_IN_FORCE = [
  { value: "DAY", label: "Day" },
  { value: "GTC", label: "Good Till Canceled" },
  { value: "IOC", label: "Immediate or Cancel" },
  { value: "FOK", label: "Fill or Kill" },
]

export const LEVERAGE_OPTIONS = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
  { value: 5, label: "5x" },
  { value: 10, label: "10x" },
  { value: 20, label: "20x" },
  { value: 50, label: "50x" },
  { value: 100, label: "100x" },
]

export const MARGIN_MODES = [
  { value: "ISOLATED", label: "Isolated Margin" },
  { value: "CROSS", label: "Cross Margin" },
]
