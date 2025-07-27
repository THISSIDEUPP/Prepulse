'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { MarketData } from '@/types'
import { mcpClient } from '@/lib/mcp-client'

interface ETFWatchlistWidgetProps {
  selectedETF: 'SPY' | 'IWM'
  setSelectedETF: (etf: 'SPY' | 'IWM') => void
}

export default function ETFWatchlistWidget({ selectedETF, setSelectedETF }: ETFWatchlistWidgetProps) {
  const [marketData, setMarketData] = useState<{SPY: MarketData | null, IWM: MarketData | null}>({
    SPY: null,
    IWM: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMarketData()
    
    const interval = setInterval(() => {
      loadMarketData()
    }, 30000)
    
    return () => {
      clearInterval(interval)
      mcpClient.disconnect()
    }
  }, [])

  const loadMarketData = async () => {
    const symbols = ['SPY', 'IWM']
    const data: {SPY: MarketData | null, IWM: MarketData | null} = {
      SPY: null,
      IWM: null
    }
    
    const mcpConnected = await mcpClient.connect()
    
    for (const symbol of symbols) {
      try {
        let marketData = null
        
        if (mcpConnected) {
          const realTimeData = await mcpClient.getRealTimeData(symbol as 'SPY' | 'IWM')
          if (realTimeData) {
            marketData = {
              id: `realtime-${symbol}`,
              date: new Date().toISOString().split('T')[0],
              symbol: symbol as 'SPY' | 'IWM',
              open_price: realTimeData.price - realTimeData.change,
              high_price: realTimeData.price + Math.abs(realTimeData.change * 0.5),
              low_price: realTimeData.price - Math.abs(realTimeData.change * 0.5),
              close_price: realTimeData.price,
              volume: realTimeData.volume,
              change_percent: realTimeData.changePercent,
              created_at: realTimeData.timestamp
            }
          }
        }
        
        if (!marketData) {
          const response = await fetch(`/api/get-market-data?symbol=${symbol}&limit=1`)
          const result = await response.json()
          marketData = result.success && result.data.length > 0 ? result.data[0] : null
        }
        
        data[symbol as 'SPY' | 'IWM'] = marketData
      } catch {
        data[symbol as 'SPY' | 'IWM'] = null
      }
    }
    
    setMarketData(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold gradient-text mb-4">ETF Watchlist</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30 mx-auto mb-3"></div>
          <p className="text-slate-300 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6">
      <h3 className="text-lg font-semibold gradient-text mb-4">ETF Watchlist</h3>
      <div className="space-y-3">
        {(['SPY', 'IWM'] as const).map((symbol) => {
          const data = marketData[symbol]
          const isSelected = selectedETF === symbol
          
          return (
            <div
              key={symbol}
              onClick={() => setSelectedETF(symbol)}
              className={`glass-card p-4 cursor-pointer transition-all ${
                isSelected ? 'border-blue-400/50 bg-blue-400/5' : 'hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-200">{symbol}</p>
                  <p className="text-xs text-slate-400">
                    {symbol === 'SPY' ? 'S&P 500 ETF' : 'Russell 2000 ETF'}
                  </p>
                </div>
                {data ? (
                  <div className="text-right">
                    <p className="font-bold vibrant-text">${data.close_price.toFixed(2)}</p>
                    <div className="flex items-center text-sm justify-end">
                      {((data.close_price - data.open_price) / data.open_price * 100) > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                      )}
                      <span className={((data.close_price - data.open_price) / data.open_price * 100) > 0 ? 'text-green-400' : 'text-red-400'}>
                        {((data.close_price - data.open_price) / data.open_price * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <BarChart3 className="w-6 h-6 text-slate-400" />
                    <p className="text-xs text-slate-400">No data</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
