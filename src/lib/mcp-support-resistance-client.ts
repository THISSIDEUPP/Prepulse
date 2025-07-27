export interface RealTimeSupportResistanceData {
  symbol: 'SPY' | 'IWM'
  currentPrice: number
  support1: number
  support2: number
  support3: number
  resistance1: number
  resistance2: number
  resistance3: number
  pivotPoint: number
  strength: string
  lastCalculated: string
  timestamp: string
}

const mockSupportResistanceData = {
  SPY: {
    currentPrice: 485.32,
    support1: 480.50,
    support2: 475.25,
    support3: 470.00,
    resistance1: 490.75,
    resistance2: 495.50,
    resistance3: 500.00,
    pivotPoint: 485.25,
    strength: 'Strong',
    lastCalculated: '2025-01-19T20:15:00Z'
  },
  IWM: {
    currentPrice: 218.76,
    support1: 215.50,
    support2: 212.25,
    support3: 209.00,
    resistance1: 222.00,
    resistance2: 225.50,
    resistance3: 229.00,
    pivotPoint: 218.75,
    strength: 'Moderate',
    lastCalculated: '2025-01-19T20:15:00Z'
  }
}

export class MCPSupportResistanceClient {
  private connected = false

  async connect() {
    try {
      console.log('MCP Support/Resistance Client connected (mock mode)')
      this.connected = true
      return true
    } catch (error) {
      console.error('Failed to connect MCP support/resistance client:', error)
      return false
    }
  }

  async getSupportResistanceData(symbol: 'SPY' | 'IWM'): Promise<RealTimeSupportResistanceData | null> {
    if (!this.connected) {
      console.warn('MCP support/resistance client not connected')
      return null
    }

    try {
      const baseData = mockSupportResistanceData[symbol]
      if (!baseData) {
        return null
      }

      const priceVariation = (Math.random() - 0.5) * 2
      const levelVariation = (Math.random() - 0.5) * 1

      return {
        symbol,
        currentPrice: Math.round((baseData.currentPrice + priceVariation) * 100) / 100,
        support1: Math.round((baseData.support1 + levelVariation) * 100) / 100,
        support2: Math.round((baseData.support2 + levelVariation) * 100) / 100,
        support3: Math.round((baseData.support3 + levelVariation) * 100) / 100,
        resistance1: Math.round((baseData.resistance1 + levelVariation) * 100) / 100,
        resistance2: Math.round((baseData.resistance2 + levelVariation) * 100) / 100,
        resistance3: Math.round((baseData.resistance3 + levelVariation) * 100) / 100,
        pivotPoint: Math.round((baseData.pivotPoint + levelVariation) * 100) / 100,
        strength: baseData.strength,
        lastCalculated: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get support/resistance data:', error)
    }

    return null
  }

  async disconnect() {
    this.connected = false
  }
}

export const mcpSupportResistanceClient = new MCPSupportResistanceClient()
