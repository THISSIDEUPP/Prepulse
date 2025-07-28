import { BaseMCPClient, ETFSymbol } from './base-mcp-client'

export interface RealTimeMarketData {
  symbol: ETFSymbol
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
}

const mockMarketData = {
  SPY: {
    price: 485.32,
    change: 2.45,
    changePercent: 0.51,
    volume: 45234567
  },
  IWM: {
    price: 218.76,
    change: -1.23,
    changePercent: -0.56,
    volume: 23456789
  }
}

export class MCPMarketDataClient extends BaseMCPClient<RealTimeMarketData> {
  protected clientName = 'MCP Market Data Client'

  async getData(symbol: ETFSymbol): Promise<RealTimeMarketData | null> {
    return this.getRealTimeData(symbol)
  }

  async getRealTimeData(symbol: ETFSymbol): Promise<RealTimeMarketData | null> {
    if (!this.isConnected()) {
      this.logConnectionWarning()
      return null
    }

    try {
      const baseData = mockMarketData[symbol]
      if (!baseData) {
        return null
      }

      const variation = (Math.random() - 0.5) * 0.02
      const currentPrice = baseData.price * (1 + variation)
      const change = currentPrice - baseData.price
      const changePercent = (change / baseData.price) * 100

      return {
        symbol,
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: baseData.volume + Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.logDataError(error)
    }

    return null
  }
}

export const mcpClient = new MCPMarketDataClient()
