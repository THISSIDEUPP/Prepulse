import { BaseMCPClient, ETFSymbol } from './base-mcp-client'

export interface RealTimeSupportResistanceData {
  symbol: ETFSymbol
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

export class MCPSupportResistanceClient extends BaseMCPClient<RealTimeSupportResistanceData> {
  protected clientName = 'MCP Support/Resistance Client'

  async getData(symbol: ETFSymbol): Promise<RealTimeSupportResistanceData | null> {
    return this.getSupportResistanceData(symbol)
  }

  async getSupportResistanceData(symbol: ETFSymbol): Promise<RealTimeSupportResistanceData | null> {
    if (!this.isConnected()) {
      this.logConnectionWarning()
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
      this.logDataError(error)
    }

    return null
  }
}

export const mcpSupportResistanceClient = new MCPSupportResistanceClient()
