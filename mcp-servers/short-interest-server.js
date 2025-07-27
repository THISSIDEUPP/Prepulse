#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')

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

class ShortInterestServer {
  constructor() {
    this.server = new Server(
      {
        name: 'short-interest-server',
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
            name: 'get_short_interest',
            description: 'Get short interest data for SPY or IWM',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  enum: ['SPY', 'IWM'],
                  description: 'ETF symbol to get short interest for'
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

      if (name === 'get_short_interest') {
        const { symbol } = args
        
        if (!symbol || !mockShortInterestData[symbol]) {
          throw new Error(`Invalid symbol: ${symbol}`)
        }

        const baseData = mockShortInterestData[symbol]
        
        const shortInterestVariation = Math.floor((Math.random() - 0.5) * 1000000)
        const shortRatioVariation = (Math.random() - 0.5) * 0.2
        
        const realTimeData = {
          symbol,
          shortInterest: Math.max(0, baseData.shortInterest + shortInterestVariation),
          sharesOutstanding: baseData.sharesOutstanding,
          shortRatio: Math.max(0.1, baseData.shortRatio + shortRatioVariation),
          daysTocover: Math.max(0.1, baseData.daysTocover + (shortRatioVariation * 0.5)),
          shortPercentFloat: Math.max(0.1, baseData.shortPercentFloat + (shortRatioVariation * 0.8)),
          lastUpdated: new Date().toISOString().split('T')[0],
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
    console.error('Short Interest MCP Server running on stdio')
  }
}

const server = new ShortInterestServer()
server.run().catch(console.error)
