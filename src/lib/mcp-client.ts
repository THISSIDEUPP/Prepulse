export interface RealTimeMarketData {
  symbol: 'SPY' | 'IWM'
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

export class MCPMarketDataClient {
  private connected = false

  async connect() {
    try {
      console.log('MCP Market Data Client connected (mock mode)')
      this.connected = true
      return true
    } catch (error) {
      console.error('Failed to connect MCP client:', error)
      return false
    }
  }

  async getRealTimeData(symbol: 'SPY' | 'IWM'): Promise<RealTimeMarketData | null> {
    if (!this.connected) {
      console.warn('MCP client not connected')
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
      console.error('Failed to get real-time data:', error)
    }

    return null
  }

  async disconnect() {
    this.connected = false
  }
}

export const mcpClient = new MCPMarketDataClient()
