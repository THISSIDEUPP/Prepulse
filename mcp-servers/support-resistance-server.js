#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')

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

class SupportResistanceServer {
  constructor() {
    this.server = new Server(
      {
        name: 'support-resistance-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    )

    this.setupToolHandlers()
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'calculate_support_resistance',
            description: 'Calculate support and resistance levels for SPY or IWM',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  enum: ['SPY', 'IWM'],
                  description: 'ETF symbol to calculate S/R levels for'
                }
              },
              required: ['symbol']
            }
          }
        ]
      }
    })

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params

      if (name === 'calculate_support_resistance') {
        const { symbol } = args
        
        if (!symbol || !mockSupportResistanceData[symbol]) {
          throw new Error(`Invalid symbol: ${symbol}`)
        }

        const baseData = mockSupportResistanceData[symbol]
        
        const priceVariation = (Math.random() - 0.5) * 2
        const levelVariation = (Math.random() - 0.5) * 1
        
        const realTimeData = {
          symbol,
          currentPrice: baseData.currentPrice + priceVariation,
          support1: baseData.support1 + levelVariation,
          support2: baseData.support2 + levelVariation,
          support3: baseData.support3 + levelVariation,
          resistance1: baseData.resistance1 + levelVariation,
          resistance2: baseData.resistance2 + levelVariation,
          resistance3: baseData.resistance3 + levelVariation,
          pivotPoint: baseData.pivotPoint + levelVariation,
          strength: baseData.strength,
          lastCalculated: new Date().toISOString(),
          timestamp: new Date().toISOString()
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(realTimeData)
            }
          ]
        }
      }

      throw new Error(`Unknown tool: ${name}`)
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Support/Resistance MCP Server running on stdio')
  }
}

const server = new SupportResistanceServer()
server.run().catch(console.error)
