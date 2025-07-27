'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Target, Activity } from 'lucide-react'
import { ShortInterestData, SupportResistanceData, TimingSignals, MarketData } from '@/types'
import { supabase } from '@/supabase/client'

interface TradingSignalsWidgetProps {
  selectedETF: 'SPY' | 'IWM'
}

export default function TradingSignalsWidget({ selectedETF }: TradingSignalsWidgetProps) {
  const [signals, setSignals] = useState<TimingSignals | null>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTradingSignals()
  }, [selectedETF])

  const loadTradingSignals = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data: shortInterestData } = await supabase
        .from('short_interest_data')
        .select('*')
        .eq('date', today)
        .eq('symbol', selectedETF)
        .single()
      
      const srResponse = await fetch(`/api/get-support-resistance?symbol=${selectedETF}&date=${today}`)
      const srResult = await srResponse.json()
      
      const marketResponse = await fetch(`/api/get-market-data?symbol=${selectedETF}&limit=1`)
      const marketResult = await marketResponse.json()
      
      setMarketData(marketResult.success && marketResult.data.length > 0 ? marketResult.data[0] : null)
      
      if (shortInterestData && srResult.data && marketResult.data && marketResult.data.length > 0) {
        const combinedSignals = calculateCombinedSignals(shortInterestData, srResult.data, marketResult.data[0])
        setSignals(combinedSignals)
      } else {
        setSignals(null)
      }
    } catch {
      setMarketData(null)
      setSignals(null)
    }
    setLoading(false)
  }

  const calculateCombinedSignals = (short: ShortInterestData, sr: SupportResistanceData, market: MarketData): TimingSignals => {
    const currentPrice = market.close_price
    const rsi = market.rsi_14 || 50
    const shortInterestElevated = short.short_interest_percent_float > 20
    const shortRatioHigh = short.short_interest_ratio > 3
    
    const supportLevels = [sr.support_1, sr.support_2, sr.support_3]
    const resistanceLevels = [sr.resistance_1, sr.resistance_2, sr.resistance_3]
    
    const nearSupport = supportLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.02)
    const nearResistance = resistanceLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.02)
    
    const rsi_oversold = rsi < 30
    const rsi_overbought = rsi > 70

    let entrySignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
    let exitSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'

    if (shortInterestElevated && nearSupport && rsi_oversold) {
      entrySignal = 'BULLISH'
      riskLevel = 'MEDIUM'
    } else if (nearResistance && rsi_overbought) {
      entrySignal = 'BEARISH'
      riskLevel = 'HIGH'
    } else if (nearSupport && rsi_oversold) {
      entrySignal = 'BULLISH'
      riskLevel = 'LOW'
    }

    if (nearResistance && rsi_overbought) {
      exitSignal = 'BEARISH'
    } else if (shortInterestElevated && shortRatioHigh) {
      exitSignal = 'BULLISH'
    }

    return {
      rsi_oversold,
      rsi_overbought,
      macd_bullish_cross: false,
      macd_bearish_cross: false,
      near_support: nearSupport,
      near_resistance: nearResistance,
      entry_signal: entrySignal === 'BULLISH' ? 'BUY' : entrySignal === 'BEARISH' ? 'SELL' : 'HOLD',
      exit_signal: exitSignal === 'BULLISH' ? 'BUY' : exitSignal === 'BEARISH' ? 'SELL' : 'HOLD',
      risk_level: riskLevel
    }
  }

  if (loading) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold gradient-text mb-4">Trading Signals</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30 mx-auto mb-3"></div>
          <p className="text-slate-300 text-sm">Loading signals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold gradient-text">Trading Signals</h3>
        <div className="text-sm text-slate-400">{selectedETF}</div>
      </div>
      
      {signals ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-sm text-slate-300 mb-1">Entry Signal</p>
            <p className={`text-lg font-bold ${
              signals.entry_signal === 'BUY' ? 'text-green-400' : 
              signals.entry_signal === 'SELL' ? 'text-red-400' : 'vibrant-text'
            }`}>
              {signals.entry_signal}
            </p>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-orange-400" />
            <p className="text-sm text-slate-300 mb-1">Exit Signal</p>
            <p className={`text-lg font-bold ${
              signals.entry_signal === 'BUY' ? 'text-green-400' : 
              signals.entry_signal === 'SELL' ? 'text-red-400' : 'vibrant-text'
            }`}>
              {signals.entry_signal}
            </p>
          </div>
          
          <div className="glass-card p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-slate-300 mb-1">Risk Level</p>
            <p className="text-lg font-bold text-yellow-400">
              MEDIUM
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 text-sm">No trading signals available</p>
          <p className="text-slate-400 text-xs mt-1">Fetch market data and calculate support/resistance levels</p>
        </div>
      )}

      {marketData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Current Price</p>
            <p className="text-sm font-bold vibrant-text">${marketData.close_price.toFixed(2)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">RSI (14)</p>
            <p className={`text-sm font-bold ${
              (marketData.rsi_14 || 50) < 30 ? 'text-green-400' : 
              (marketData.rsi_14 || 50) > 70 ? 'text-red-400' : 'vibrant-text'
            }`}>
              {(marketData.rsi_14 || 50).toFixed(1)}
            </p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Volume</p>
            <p className="text-sm font-bold vibrant-text">{(marketData.volume / 1000000).toFixed(1)}M</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Change</p>
            <p className={`text-sm font-bold ${((marketData.close_price - marketData.open_price) / marketData.open_price * 100) > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {((marketData.close_price - marketData.open_price) / marketData.open_price * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
