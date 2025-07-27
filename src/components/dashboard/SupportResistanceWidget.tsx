'use client'

import React, { useState, useEffect } from 'react'
import { Target, Calculator, Activity } from 'lucide-react'
import { SupportResistanceData, TimingSignals, MarketData } from '@/types'

interface SupportResistanceWidgetProps {
  selectedETF: 'SPY' | 'IWM'
}

export default function SupportResistanceWidget({ selectedETF }: SupportResistanceWidgetProps) {
  const [srData, setSrData] = useState<SupportResistanceData | null>(null)
  const [signals, setSignals] = useState<TimingSignals | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    loadSupportResistanceData()
  }, [selectedETF])

  const loadSupportResistanceData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const srResponse = await fetch(`/api/get-support-resistance?symbol=${selectedETF}&date=${today}`)
      const srResult = await srResponse.json()
      
      const marketResponse = await fetch(`/api/get-market-data?symbol=${selectedETF}&limit=1`)
      const marketResult = await marketResponse.json()

      if (srResult.success && srResult.data) {
        setSrData(srResult.data)
        
        if (marketResult.success && marketResult.data && marketResult.data.length > 0) {
          const marketData = marketResult.data[0]
          const timingSignals = calculateTimingSignals(marketData, srResult.data)
          setSignals(timingSignals)
        }
      } else {
        setSrData(null)
        setSignals(null)
      }
    } catch {
      setSrData(null)
      setSignals(null)
    }
    setLoading(false)
  }

  const calculateTimingSignals = (marketData: MarketData, srData: SupportResistanceData): TimingSignals => {
    const currentPrice = marketData.close_price
    const rsi = marketData.rsi_14 || 50
    // const macdLine = marketData.macd_line || 0
    // const macdSignal = marketData.macd_signal || 0
    
    const rsi_oversold = rsi < 30
    const rsi_overbought = rsi > 70
    // const macd_bullish_cross = macdLine > macdSignal
    
    const supportLevels = [srData.support_1, srData.support_2, srData.support_3]
    const resistanceLevels = [srData.resistance_1, srData.resistance_2, srData.resistance_3]
    
    const nearSupport = supportLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.02)
    const nearResistance = resistanceLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.02)

    return {
      rsi_oversold,
      rsi_overbought,
      macd_bullish_cross: false,
      macd_bearish_cross: false,
      near_support: nearSupport,
      near_resistance: nearResistance,
      entry_signal: (rsi_oversold && nearSupport) ? 'BUY' : (rsi_overbought && nearResistance) ? 'SELL' : 'HOLD',
      exit_signal: (rsi_overbought && nearResistance) ? 'SELL' : (rsi_oversold && nearSupport) ? 'BUY' : 'HOLD',
      risk_level: nearResistance ? 'HIGH' : nearSupport ? 'LOW' : 'MEDIUM'
    }
  }

  const handleCalculateSR = async () => {
    setCalculating(true)
    try {
      const response = await fetch('/api/calculate-support-resistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: selectedETF })
      })

      if (response.ok) {
        await loadSupportResistanceData()
      }
    } catch {
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold gradient-text mb-4">Support &amp; Resistance</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30 mx-auto mb-3"></div>
          <p className="text-slate-300 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold gradient-text">Support &amp; Resistance</h3>
        <button
          onClick={handleCalculateSR}
          disabled={calculating}
          className="btn-glass text-xs px-2 py-1 flex items-center space-x-1 disabled:opacity-50"
        >
          <Calculator className="w-3 h-3" />
          <span>{calculating ? 'Calculating...' : 'Calculate'}</span>
        </button>
      </div>

      {srData ? (
        <div className="space-y-4">
          {signals && (
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card p-2 text-center">
                <Target className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <p className="text-xs text-slate-300">Entry</p>
                <p className="text-sm font-bold vibrant-text">{signals.entry_signal}</p>
              </div>
              <div className="glass-card p-2 text-center">
                <Activity className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                <p className="text-xs text-slate-300">Exit</p>
                <p className="text-sm font-bold vibrant-text">{signals.entry_signal}</p>
              </div>
              <div className="glass-card p-2 text-center">
                <Target className="w-4 h-4 mx-auto mb-1 text-red-400" />
                <p className="text-xs text-slate-300">Risk</p>
                <p className="text-sm font-bold vibrant-text">MEDIUM</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-2">Resistance Levels</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-slate-400">R1</p>
                  <p className="text-sm font-bold text-red-400">${srData.resistance_1.toFixed(2)}</p>
                </div>
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-slate-400">R2</p>
                  <p className="text-sm font-bold text-red-400">${srData.resistance_2.toFixed(2)}</p>
                </div>
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-slate-400">R3</p>
                  <p className="text-sm font-bold text-red-400">${srData.resistance_3.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-2">Support Levels</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-slate-400">S1</p>
                  <p className="text-sm font-bold text-green-400">${srData.support_1.toFixed(2)}</p>
                </div>
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-slate-400">S2</p>
                  <p className="text-sm font-bold text-green-400">${srData.support_2.toFixed(2)}</p>
                </div>
                <div className="glass-card p-2 text-center">
                  <p className="text-xs text-slate-400">S3</p>
                  <p className="text-sm font-bold text-green-400">${srData.support_3.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300 mb-3">No S/R data available</p>
          <button
            onClick={handleCalculateSR}
            disabled={calculating}
            className="btn-primary-glass text-xs px-3 py-1 disabled:opacity-50"
          >
            {calculating ? 'Calculating...' : 'Calculate Levels'}
          </button>
        </div>
      )}
    </div>
  )
}
