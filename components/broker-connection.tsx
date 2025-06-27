"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tradingAPI, type BrokerConfig } from "@/lib/trading-api"
import { cryptoAPI, type CryptoExchangeConfig } from "@/lib/crypto-api"
import { rithmicAPI, type RithmicConfig } from "@/lib/rithmic-api"
import { BROKER_CONFIGS, CRYPTO_CONFIGS, CRYPTO_EXCHANGES } from "@/lib/broker-configs"
import { Wifi, WifiOff, Settings, Key, AlertTriangle, CheckCircle, Bitcoin, TrendingUp } from "lucide-react"

interface BrokerConnectionProps {
  onConnectionChange: (connected: boolean) => void
}

export function BrokerConnection({ onConnectionChange }: BrokerConnectionProps) {
  const [activeTab, setActiveTab] = useState("traditional")

  // Traditional brokers
  const [selectedBroker, setSelectedBroker] = useState<string>("alpaca")
  const [apiKey, setApiKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [accountId, setAccountId] = useState("")
  const [sandbox, setSandbox] = useState(true)

  // Crypto exchanges
  const [selectedCrypto, setSelectedCrypto] = useState<string>("bybit")
  const [cryptoApiKey, setCryptoApiKey] = useState("")
  const [cryptoSecretKey, setCryptoSecretKey] = useState("")
  const [cryptoPassphrase, setCryptoPassphrase] = useState("")
  const [cryptoTestnet, setCryptoTestnet] = useState(true)

  // Rithmic specific fields
  const [rithmicUsername, setRithmicUsername] = useState("")
  const [rithmicPassword, setRithmicPassword] = useState("")
  const [rithmicSystemName, setRithmicSystemName] = useState("Rithmic Test")
  const [rithmicAppName, setRithmicAppName] = useState("NEXUS")
  const [rithmicAppVersion, setRithmicAppVersion] = useState("1.0.0")
  const [rithmicGateway, setRithmicGateway] = useState("login_agent_pnl")

  // Connection states
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [connectionType, setConnectionType] = useState<"traditional" | "crypto" | "rithmic">("traditional")

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem("broker-config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)

        if (config.type === "crypto") {
          setActiveTab("crypto")
          setSelectedCrypto(config.name)
          setCryptoApiKey(config.apiKey || "")
          setCryptoSecretKey(config.secretKey || "")
          setCryptoPassphrase(config.passphrase || "")
          setCryptoTestnet(config.testnet)
        } else if (config.type === "rithmic") {
          setActiveTab("traditional")
          setSelectedBroker("rithmic")
          setRithmicUsername(config.username || "")
          setRithmicPassword(config.password || "")
          setRithmicSystemName(config.systemName || "Rithmic Test")
          setRithmicAppName(config.appName || "NEXUS")
          setRithmicAppVersion(config.appVersion || "1.0.0")
          setRithmicGateway(config.gateway || "login_agent_pnl")
          setSandbox(config.sandbox)
        } else {
          setActiveTab("traditional")
          setSelectedBroker(config.name)
          setApiKey(config.apiKey || "")
          setSecretKey(config.secretKey || "")
          setAccountId(config.accountId || "")
          setSandbox(config.sandbox)
        }
      } catch (error) {
        console.error("Failed to load saved config:", error)
      }
    }
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setConnectionError(null)

    try {
      if (activeTab === "crypto") {
        // Handle crypto exchange connection
        const baseConfig =
          CRYPTO_CONFIGS[cryptoTestnet ? `${selectedCrypto}_testnet` || `${selectedCrypto}_sandbox` : selectedCrypto] ||
          CRYPTO_CONFIGS[selectedCrypto]

        const config: CryptoExchangeConfig = {
          ...baseConfig,
          apiKey: cryptoApiKey,
          secretKey: cryptoSecretKey,
          passphrase: cryptoPassphrase,
          testnet: cryptoTestnet,
        }

        cryptoAPI.configure(config)

        // Test connection by getting account info
        const account = await cryptoAPI.getAccount()
        setAccountInfo(account)

        // Save configuration
        localStorage.setItem(
          "broker-config",
          JSON.stringify({
            ...config,
            type: "crypto",
          }),
        )

        setConnected(true)
        setConnectionType("crypto")
        onConnectionChange(true)

        // Connect to crypto market data
        await cryptoAPI.connectMarketData(["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT"])
      } else if (selectedBroker === "rithmic") {
        // Handle Rithmic connection
        const rithmicConfig: RithmicConfig = {
          username: rithmicUsername,
          password: rithmicPassword,
          systemName: rithmicSystemName,
          appName: rithmicAppName,
          appVersion: rithmicAppVersion,
          environment: sandbox ? "test" : "live",
          gateway: rithmicGateway,
        }

        rithmicAPI.configure(rithmicConfig)
        await rithmicAPI.connect()

        // Subscribe to account updates
        rithmicAPI.onAccountUpdate((account) => {
          setAccountInfo({
            accountId: account.accountId,
            totalValue: account.netLiquidationValue,
            buyingPower: account.buyingPower,
            cash: account.totalCashValue,
            marginUsed: account.maintenanceMargin,
          })
        })

        // Save configuration
        localStorage.setItem(
          "broker-config",
          JSON.stringify({
            type: "rithmic",
            username: rithmicUsername,
            password: rithmicPassword,
            systemName: rithmicSystemName,
            appName: rithmicAppName,
            appVersion: rithmicAppVersion,
            gateway: rithmicGateway,
            sandbox,
          }),
        )

        setConnected(true)
        setConnectionType("rithmic")
        onConnectionChange(true)

        // Subscribe to futures market data
        await rithmicAPI.subscribeMarketData("ESM4", "CME")
        await rithmicAPI.subscribeMarketData("NQM4", "CME")
      } else {
        // Handle other traditional brokers
        const baseConfig =
          BROKER_CONFIGS[sandbox ? selectedBroker : `${selectedBroker}_live`] || BROKER_CONFIGS[selectedBroker]

        const config: BrokerConfig = {
          ...baseConfig,
          apiKey,
          secretKey,
          accountId,
          sandbox,
        }

        // Configure the trading API
        tradingAPI.configure(config)

        // Test connection by getting account info
        const account = await tradingAPI.getAccount()
        setAccountInfo(account)

        // Save configuration
        localStorage.setItem(
          "broker-config",
          JSON.stringify({
            ...config,
            type: "traditional",
          }),
        )

        setConnected(true)
        setConnectionType("traditional")
        onConnectionChange(true)

        // Connect to market data for default symbols
        await tradingAPI.connectMarketData(["ES", "NQ", "SPY", "QQQ"])
      }
    } catch (error) {
      console.error("Connection failed:", error)
      setConnectionError(error instanceof Error ? error.message : "Connection failed")
      setConnected(false)
      onConnectionChange(false)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    if (connectionType === "crypto") {
      cryptoAPI.disconnect()
    } else if (connectionType === "rithmic") {
      rithmicAPI.disconnect()
    } else {
      tradingAPI.disconnect()
    }
    setConnected(false)
    setAccountInfo(null)
    onConnectionChange(false)
  }

  const brokerOptions = [
    { value: "alpaca", label: "Alpaca Markets", description: "Commission-free stock & crypto trading" },
    { value: "polygon", label: "Polygon.io", description: "Real-time market data" },
    { value: "finnhub", label: "Finnhub", description: "Stock market data" },
    { value: "interactive_brokers", label: "Interactive Brokers", description: "Professional trading platform" },
    { value: "td_ameritrade", label: "TD Ameritrade", description: "Full-service broker" },
    { value: "rithmic", label: "Rithmic", description: "Professional futures trading platform" },
  ]

  const selectedBrokerInfo = brokerOptions.find((b) => b.value === selectedBroker)
  const selectedCryptoInfo = CRYPTO_EXCHANGES.find((e) => e.value === selectedCrypto)

  return (
    <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>Broker Connection</span>
          </div>
          <Badge
            variant="outline"
            className={
              connected
                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                : "border-red-500/50 text-red-400 bg-red-500/10"
            }
          >
            {connected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                CONNECTED
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                DISCONNECTED
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-96 overflow-y-auto">
        {!connected ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Traditional</span>
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex items-center space-x-2">
                <Bitcoin className="w-4 h-4" />
                <span>Crypto</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="traditional" className="space-y-4">
              {/* Traditional Broker Configuration */}
              <div>
                <Label htmlFor="broker">Select Broker</Label>
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {brokerOptions.map((broker) => (
                      <SelectItem key={broker.value} value={broker.value}>
                        <div>
                          <div className="font-medium">{broker.label}</div>
                          <div className="text-xs text-slate-400">{broker.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBrokerInfo && (
                  <div className="text-xs text-slate-400 mt-1">{selectedBrokerInfo.description}</div>
                )}
              </div>

              {/* Sandbox Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sandbox">{selectedBroker === "rithmic" ? "Test Environment" : "Sandbox Mode"}</Label>
                  <div className="text-xs text-slate-400">
                    {selectedBroker === "rithmic" ? "Use Rithmic test environment" : "Use paper trading environment"}
                  </div>
                </div>
                <Switch id="sandbox" checked={sandbox} onCheckedChange={setSandbox} />
              </div>

              {/* API Credentials */}
              <div className="space-y-4">
                {selectedBroker === "rithmic" ? (
                  <>
                    {/* Rithmic specific fields */}
                    <div>
                      <Label htmlFor="rithmicUsername">Username</Label>
                      <Input
                        id="rithmicUsername"
                        value={rithmicUsername}
                        onChange={(e) => setRithmicUsername(e.target.value)}
                        placeholder="Enter your Rithmic username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rithmicPassword">Password</Label>
                      <Input
                        id="rithmicPassword"
                        type="password"
                        value={rithmicPassword}
                        onChange={(e) => setRithmicPassword(e.target.value)}
                        placeholder="Enter your Rithmic password"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rithmicSystemName">System Name</Label>
                      <Input
                        id="rithmicSystemName"
                        value={rithmicSystemName}
                        onChange={(e) => setRithmicSystemName(e.target.value)}
                        placeholder="Rithmic Test"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rithmicAppName">App Name</Label>
                        <Input
                          id="rithmicAppName"
                          value={rithmicAppName}
                          onChange={(e) => setRithmicAppName(e.target.value)}
                          placeholder="NEXUS"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rithmicAppVersion">App Version</Label>
                        <Input
                          id="rithmicAppVersion"
                          value={rithmicAppVersion}
                          onChange={(e) => setRithmicAppVersion(e.target.value)}
                          placeholder="1.0.0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="rithmicGateway">Gateway</Label>
                      <Select value={rithmicGateway} onValueChange={setRithmicGateway}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="login_agent_pnl">PnL Gateway</SelectItem>
                          <SelectItem value="login_agent_order">Order Gateway</SelectItem>
                          <SelectItem value="login_agent_md">Market Data Gateway</SelectItem>
                          <SelectItem value="login_agent_history">History Gateway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standard API fields */}
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>

                    {(selectedBroker === "alpaca" || selectedBroker === "interactive_brokers") && (
                      <div>
                        <Label htmlFor="secretKey">Secret Key</Label>
                        <Input
                          id="secretKey"
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="Enter your secret key"
                        />
                      </div>
                    )}

                    {selectedBroker === "interactive_brokers" && (
                      <div>
                        <Label htmlFor="accountId">Account ID</Label>
                        <Input
                          id="accountId"
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          placeholder="Enter your account ID"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="crypto" className="space-y-4">
              {/* Crypto Exchange Configuration */}
              <div>
                <Label htmlFor="cryptoExchange">Select Exchange</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_EXCHANGES.map((exchange) => (
                      <SelectItem key={exchange.value} value={exchange.value}>
                        <div>
                          <div className="font-medium">{exchange.label}</div>
                          <div className="text-xs text-slate-400">{exchange.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCryptoInfo && (
                  <div className="text-xs text-slate-400 mt-1">{selectedCryptoInfo.description}</div>
                )}
              </div>

              {/* Testnet Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cryptoTestnet">Testnet Mode</Label>
                  <div className="text-xs text-slate-400">Use testnet environment for testing</div>
                </div>
                <Switch id="cryptoTestnet" checked={cryptoTestnet} onCheckedChange={setCryptoTestnet} />
              </div>

              {/* Crypto API Credentials */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cryptoApiKey">API Key</Label>
                  <Input
                    id="cryptoApiKey"
                    type="password"
                    value={cryptoApiKey}
                    onChange={(e) => setCryptoApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                </div>

                <div>
                  <Label htmlFor="cryptoSecretKey">Secret Key</Label>
                  <Input
                    id="cryptoSecretKey"
                    type="password"
                    value={cryptoSecretKey}
                    onChange={(e) => setCryptoSecretKey(e.target.value)}
                    placeholder="Enter your secret key"
                  />
                </div>

                {selectedCrypto === "kucoin" && (
                  <div>
                    <Label htmlFor="cryptoPassphrase">Passphrase</Label>
                    <Input
                      id="cryptoPassphrase"
                      type="password"
                      value={cryptoPassphrase}
                      onChange={(e) => setCryptoPassphrase(e.target.value)}
                      placeholder="Enter your passphrase"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Connection Error */}
            {connectionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection Failed</span>
                </div>
                <p className="text-sm text-slate-300 mt-1">{connectionError}</p>
              </div>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={
                connecting ||
                (activeTab === "crypto"
                  ? !cryptoApiKey || !cryptoSecretKey || (selectedCrypto === "kucoin" && !cryptoPassphrase)
                  : selectedBroker === "rithmic"
                    ? !rithmicUsername || !rithmicPassword
                    : !apiKey)
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Connect to {activeTab === "crypto" ? selectedCryptoInfo?.label : selectedBrokerInfo?.label}
                </>
              )}
            </Button>

            {/* Setup Instructions */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-sm text-blue-400 mb-2">Setup Instructions:</div>
              <ul className="text-xs text-slate-300 space-y-1">
                {activeTab === "crypto" ? (
                  <>
                    <li>• Create an account with your chosen crypto exchange</li>
                    <li>• Generate API keys in the exchange's API management section</li>
                    <li>• Enable trading permissions for your API keys</li>
                    <li>• Start with testnet mode for safe testing</li>
                    <li>• Ensure proper 2FA and security settings</li>
                  </>
                ) : selectedBroker === "rithmic" ? (
                  <>
                    <li>• Contact Rithmic to open a trading account</li>
                    <li>• Obtain your username and password credentials</li>
                    <li>• Start with test environment for paper trading</li>
                    <li>• Ensure proper risk management settings</li>
                  </>
                ) : (
                  <>
                    <li>• Create an account with your chosen broker</li>
                    <li>• Generate API keys in your broker's developer section</li>
                    <li>• Start with sandbox mode for testing</li>
                    <li>• Ensure sufficient account balance for trading</li>
                  </>
                )}
              </ul>
            </div>
          </Tabs>
        ) : (
          <>
            {/* Connected State */}
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    Connected to {connectionType === "crypto" ? selectedCryptoInfo?.label : selectedBrokerInfo?.label}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {connectionType === "crypto"
                    ? cryptoTestnet
                      ? "Testnet Mode"
                      : "Live Trading Mode"
                    : connectionType === "rithmic"
                      ? sandbox
                        ? "Test Environment"
                        : "Live Environment"
                      : sandbox
                        ? "Paper Trading Mode"
                        : "Live Trading Mode"}
                </div>
              </div>

              {/* Account Information */}
              {accountInfo && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white">Account Information</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">
                        {connectionType === "crypto" ? "Total Balance:" : "Account Value:"}
                      </span>
                      <div className="font-mono text-emerald-400">
                        ${(accountInfo.totalBalance || accountInfo.totalValue || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">
                        {connectionType === "crypto" ? "Available:" : "Buying Power:"}
                      </span>
                      <div className="font-mono text-blue-400">
                        ${(accountInfo.availableBalance || accountInfo.buyingPower || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">{connectionType === "crypto" ? "Margin:" : "Cash:"}</span>
                      <div className="font-mono text-purple-400">
                        ${(accountInfo.marginBalance || accountInfo.cash || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">
                        {connectionType === "crypto"
                          ? "Unrealized PnL:"
                          : connectionType === "rithmic"
                            ? "Margin Used:"
                            : "Day Trades:"}
                      </span>
                      <div className="font-mono text-orange-400">
                        {connectionType === "crypto"
                          ? `$${(accountInfo.unrealizedPnl || 0).toLocaleString()}`
                          : connectionType === "rithmic"
                            ? `$${(accountInfo.marginUsed || 0).toLocaleString()}`
                            : `${accountInfo.dayTradeCount || 0}/3`}
                      </div>
                    </div>
                  </div>

                  {accountInfo.patternDayTrader && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                      Pattern Day Trader Account
                    </div>
                  )}
                </div>
              )}

              {/* Disconnect Button */}
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
