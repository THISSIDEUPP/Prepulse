#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')

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

class MarketDataServer {
  constructor() {
    this.server = new Server(
      {
        name: 'market-data-server',
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
            name: 'get_real_time_quote',
            description: 'Get real-time market data for SPY or IWM',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  enum: ['SPY', 'IWM'],
                  description: 'ETF symbol to get quote for'
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

      if (name === 'get_real_time_quote') {
        const { symbol } = args
        
        if (!symbol || !mockMarketData[symbol]) {
          throw new Error(`Invalid symbol: ${symbol}`)
        }

        const baseData = mockMarketData[symbol]
        const variation = (Math.random() - 0.5) * 0.02
        const currentPrice = baseData.price * (1 + variation)
        const change = currentPrice - baseData.price
        const changePercent = (change / baseData.price) * 100

        const realTimeData = {
          symbol,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          volume: baseData.volume + Math.floor(Math.random() * 10000),
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
    console.error('Market Data MCP Server running on stdio')
  }
}

const server = new MarketDataServer()
server.run().catch(console.error)
