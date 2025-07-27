export interface RealTimeShortInterestData {
  symbol: 'SPY' | 'IWM'
  shortInterest: number
  sharesOutstanding: number
  shortRatio: number
  daysTocover: number
  shortPercentFloat: number
  lastUpdated: string
  timestamp: string
}

const mockShortInterestData = {
  SPY: {
    shortInterest: 45234567,
    sharesOutstanding: 9234567890,
    shortRatio: 2.3,
    daysTocover: 1.8,
    shortPercentFloat: 4.9,
    lastUpdated: '2025-01-19'
  },
  IWM: {
    shortInterest: 78456123,
    sharesOutstanding: 1234567890,
    shortRatio: 4.7,
    daysTocover: 3.2,
    shortPercentFloat: 6.4,
    lastUpdated: '2025-01-19'
  }
}

export class MCPShortInterestClient {
  private connected = false

  async connect() {
    try {
      console.log('MCP Short Interest Client connected (mock mode)')
      this.connected = true
      return true
    } catch (error) {
      console.error('Failed to connect MCP short interest client:', error)
      return false
    }
  }

  async getShortInterestData(symbol: 'SPY' | 'IWM'): Promise<RealTimeShortInterestData | null> {
    if (!this.connected) {
      console.warn('MCP short interest client not connected')
      return null
    }

    try {
      const baseData = mockShortInterestData[symbol]
      if (!baseData) {
        return null
      }

      const shortInterestVariation = Math.floor((Math.random() - 0.5) * 1000000)
      const shortRatioVariation = (Math.random() - 0.5) * 0.2

      return {
        symbol,
        shortInterest: Math.max(0, baseData.shortInterest + shortInterestVariation),
        sharesOutstanding: baseData.sharesOutstanding,
        shortRatio: Math.max(0.1, baseData.shortRatio + shortRatioVariation),
        daysTocover: Math.max(0.1, baseData.daysTocover + (shortRatioVariation * 0.5)),
        shortPercentFloat: Math.max(0.1, baseData.shortPercentFloat + (shortRatioVariation * 0.8)),
        lastUpdated: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get short interest data:', error)
    }

    return null
  }

  async disconnect() {
    this.connected = false
  }
}

export const mcpShortInterestClient = new MCPShortInterestClient()
