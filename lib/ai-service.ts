"use client"

interface AIResponse {
  message: string
  confidence: number
  emotion: "neutral" | "excited" | "concerned" | "analytical" | "celebrating"
  recommendations?: string[]
}

interface MarketContext {
  currentPrice: number
  dailyPnL: number
  portfolioHeat: number
  winRate: number
  totalTrades: number
  cumulativeDelta: number
  volatility: number
  openTrades: number
  recentTrades: any[]
}

interface AIConfig {
  mode: "local" | "online"
  apiKey?: string
  model?: string
  endpoint?: string
}

class AIService {
  private config: AIConfig = {
    mode: "local",
  }

  private localResponses = {
    greetings: [
      "Good morning! I'm analyzing current market conditions for optimal trading opportunities.",
      "Hello! Market sentiment appears favorable today. Ready to assist with your trading decisions.",
      "Greetings, trader! I've been monitoring the order flow and have some insights to share.",
    ],

    marketAnalysis: {
      bullish: [
        "Strong buying pressure detected. Delta flow is positive with {delta} cumulative delta.",
        "Market structure looks bullish. Consider long positions near support levels.",
        "Institutional buying activity increasing. Volume profile supports upward movement.",
      ],
      bearish: [
        "Selling pressure mounting. Delta showing {delta} negative flow.",
        "Market showing signs of weakness. Consider defensive positioning.",
        "Distribution pattern emerging. Caution advised on long positions.",
      ],
      neutral: [
        "Market in consolidation phase. Waiting for clear directional bias.",
        "Mixed signals in the order flow. Patience recommended.",
        "Range-bound conditions. Look for breakout opportunities.",
      ],
    },

    performance: {
      positive: [
        "Excellent performance! Your P&L of ${pnl} shows strong trading discipline.",
        "Outstanding results today! Win rate of {winRate}% demonstrates skill.",
        "Impressive trading! Your strategies are performing exceptionally well.",
      ],
      negative: [
        "Challenging session detected. Current drawdown requires careful risk management.",
        "Performance below expectations. Consider reducing position sizes.",
        "Difficult market conditions. Focus on capital preservation.",
      ],
      neutral: [
        "Steady performance maintained. Continue following your trading plan.",
        "Consistent execution observed. Stay disciplined with your approach.",
        "Balanced trading session. Risk management protocols effective.",
      ],
    },

    risk: {
      high: [
        "ALERT: Portfolio heat at {heat}%. Immediate risk reduction recommended!",
        "High risk detected! Consider closing some positions to protect capital.",
        "Portfolio exposure elevated. Implement defensive measures now.",
      ],
      moderate: [
        "Portfolio heat at {heat}%. Monitor positions closely.",
        "Risk levels elevated but manageable. Stay vigilant.",
        "Moderate risk detected. Consider position adjustments.",
      ],
      low: [
        "Risk levels optimal at {heat}%. Good position management.",
        "Portfolio well-balanced. Risk parameters within acceptable range.",
        "Excellent risk control. Continue current approach.",
      ],
    },

    strategies: {
      liquidityAbsorption: [
        "Large order absorption detected at {price}. High probability setup forming.",
        "Institutional activity suggests liquidity absorption. Consider entry.",
        "Volume spike indicates absorption pattern. Monitor for continuation.",
      ],
      deltaDiv: [
        "Delta divergence identified. Price and delta flow misaligned.",
        "Negative delta divergence suggests potential reversal opportunity.",
        "Delta analysis indicates hidden selling pressure.",
      ],
      hvnRejection: [
        "High volume node rejection confirmed. Strong resistance level.",
        "HVN acting as significant barrier. Reversal probability high.",
        "Volume profile shows rejection at key level. Setup validated.",
      ],
    },
  }

  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
  }

  getConfig(): AIConfig {
    return this.config
  }

  async analyzeMarket(context: MarketContext): Promise<AIResponse> {
    if (this.config.mode === "online") {
      return this.analyzeMarketOnline(context)
    } else {
      return this.analyzeMarketLocal(context)
    }
  }

  private async analyzeMarketLocal(context: MarketContext): Promise<AIResponse> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

    const { cumulativeDelta, dailyPnL, portfolioHeat, winRate } = context

    // Determine market sentiment
    let sentiment: "bullish" | "bearish" | "neutral"
    if (cumulativeDelta > 1000) sentiment = "bullish"
    else if (cumulativeDelta < -1000) sentiment = "bearish"
    else sentiment = "neutral"

    // Determine performance state
    let perfState: "positive" | "negative" | "neutral"
    if (dailyPnL > 1000) perfState = "positive"
    else if (dailyPnL < -500) perfState = "negative"
    else perfState = "neutral"

    // Determine risk level
    let riskLevel: "high" | "moderate" | "low"
    if (portfolioHeat > 2.5) riskLevel = "high"
    else if (portfolioHeat > 1.5) riskLevel = "moderate"
    else riskLevel = "low"

    // Select appropriate response
    let responsePool: string[]
    let emotion: AIResponse["emotion"] = "neutral"
    let confidence = 0.7

    if (riskLevel === "high") {
      responsePool = this.localResponses.risk.high
      emotion = "concerned"
      confidence = 0.95
    } else if (perfState === "positive") {
      responsePool = this.localResponses.performance.positive
      emotion = "excited"
      confidence = 0.85
    } else if (sentiment === "bullish" || sentiment === "bearish") {
      responsePool = this.localResponses.marketAnalysis[sentiment]
      emotion = "analytical"
      confidence = 0.8
    } else {
      responsePool = this.localResponses.marketAnalysis.neutral
      emotion = "neutral"
      confidence = 0.6
    }

    const template = responsePool[Math.floor(Math.random() * responsePool.length)]
    const message = template
      .replace("{delta}", cumulativeDelta.toString())
      .replace("{pnl}", dailyPnL.toFixed(2))
      .replace("{winRate}", winRate.toFixed(1))
      .replace("{heat}", portfolioHeat.toFixed(1))
      .replace("{price}", context.currentPrice.toFixed(2))

    // Generate recommendations based on context
    const recommendations = this.generateRecommendations(context, sentiment, riskLevel)

    return {
      message,
      confidence,
      emotion,
      recommendations,
    }
  }

  private async analyzeMarketOnline(context: MarketContext): Promise<AIResponse> {
    try {
      // Simulate online API call
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      if (!this.config.apiKey) {
        throw new Error("API key not configured for online mode")
      }

      // Mock online API response (replace with actual API call)
      const prompt = `Analyze the following trading context and provide insights:
        Current Price: ${context.currentPrice}
        Daily P&L: ${context.dailyPnL}
        Portfolio Heat: ${context.portfolioHeat}%
        Win Rate: ${context.winRate}%
        Cumulative Delta: ${context.cumulativeDelta}
        Volatility: ${context.volatility}
        Open Trades: ${context.openTrades}
        
        Provide a brief analysis and trading recommendation.`

      // This would be replaced with actual API call
      const response = await this.mockOnlineAPI(prompt, context)

      return response
    } catch (error) {
      console.error("Online AI analysis failed, falling back to local:", error)
      return this.analyzeMarketLocal(context)
    }
  }

  private async mockOnlineAPI(prompt: string, context: MarketContext): Promise<AIResponse> {
    // Mock sophisticated online AI response
    const responses = [
      {
        message: `Advanced market analysis indicates ${context.cumulativeDelta > 0 ? "bullish" : "bearish"} momentum with ${context.volatility.toFixed(2)} volatility. Current portfolio heat of ${context.portfolioHeat.toFixed(1)}% suggests ${context.portfolioHeat > 2 ? "elevated" : "manageable"} risk levels.`,
        emotion:
          context.portfolioHeat > 2.5 ? "concerned" : context.dailyPnL > 500 ? "excited" : ("analytical" as const),
        confidence: 0.92,
      },
      {
        message: `Neural network analysis of order flow patterns suggests ${Math.abs(context.cumulativeDelta) > 1000 ? "strong directional bias" : "consolidation phase"}. Risk-adjusted returns indicate ${context.winRate > 70 ? "excellent" : "moderate"} strategy performance.`,
        emotion: "analytical" as const,
        confidence: 0.88,
      },
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]

    return {
      ...response,
      recommendations: this.generateAdvancedRecommendations(context),
    }
  }

  private generateRecommendations(context: MarketContext, sentiment: string, riskLevel: string): string[] {
    const recommendations: string[] = []

    if (riskLevel === "high") {
      recommendations.push("Reduce position sizes immediately")
      recommendations.push("Close weakest performing trades")
      recommendations.push("Implement strict stop losses")
    }

    if (context.winRate < 60) {
      recommendations.push("Review entry criteria for recent losses")
      recommendations.push("Consider reducing trade frequency")
      recommendations.push("Focus on highest probability setups")
    }

    if (sentiment === "bullish" && riskLevel !== "high") {
      recommendations.push("Look for long opportunities on pullbacks")
      recommendations.push("Monitor for breakout above resistance")
    }

    if (context.openTrades > 5) {
      recommendations.push("Consider consolidating open positions")
      recommendations.push("Focus on best risk/reward setups")
    }

    return recommendations.slice(0, 3)
  }

  private generateAdvancedRecommendations(context: MarketContext): string[] {
    const recommendations: string[] = []

    // Advanced AI recommendations
    if (context.volatility > 1.5) {
      recommendations.push("High volatility detected - consider volatility-based position sizing")
    }

    if (Math.abs(context.cumulativeDelta) > 2000) {
      recommendations.push("Strong delta flow - monitor for continuation or exhaustion")
    }

    if (context.portfolioHeat > 2.0) {
      recommendations.push("Portfolio heat elevated - implement dynamic hedging strategies")
    }

    return recommendations.slice(0, 3)
  }

  async processVoiceCommand(command: string, context: MarketContext): Promise<AIResponse> {
    if (this.config.mode === "online") {
      return this.processVoiceCommandOnline(command, context)
    } else {
      return this.processVoiceCommandLocal(command, context)
    }
  }

  private async processVoiceCommandLocal(command: string, context: MarketContext): Promise<AIResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("performance") || lowerCommand.includes("how am i doing")) {
      return {
        message: `Your current performance shows ${context.totalTrades} trades with a ${context.winRate.toFixed(1)}% win rate. Daily P&L is $${context.dailyPnL.toFixed(2)}.`,
        confidence: 0.9,
        emotion: context.dailyPnL > 0 ? "excited" : "analytical",
      }
    }

    if (lowerCommand.includes("risk") || lowerCommand.includes("exposure")) {
      const riskLevel = context.portfolioHeat > 2.5 ? "high" : context.portfolioHeat > 1.5 ? "moderate" : "low"
      return {
        message: `Portfolio heat is currently ${context.portfolioHeat.toFixed(1)}%, which is ${riskLevel} risk. You have ${context.openTrades} open positions.`,
        confidence: 0.95,
        emotion: riskLevel === "high" ? "concerned" : "neutral",
      }
    }

    if (lowerCommand.includes("market") || lowerCommand.includes("analysis")) {
      return this.analyzeMarket(context)
    }

    return {
      message: "I'm here to help with your trading analysis. Ask me about performance, risk, or market conditions.",
      confidence: 0.7,
      emotion: "neutral",
    }
  }

  private async processVoiceCommandOnline(command: string, context: MarketContext): Promise<AIResponse> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock online voice processing
      const response = await this.mockOnlineAPI(
        `Process voice command: "${command}" with context: ${JSON.stringify(context)}`,
        context,
      )
      return response
    } catch (error) {
      console.error("Online voice processing failed, falling back to local:", error)
      return this.processVoiceCommandLocal(command, context)
    }
  }
}

export const aiService = new AIService()
