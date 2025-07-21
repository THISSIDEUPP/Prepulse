'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, ArrowLeft, Calculator, Target, AlertCircle, Activity } from 'lucide-react'
import Link from 'next/link'
import { SupportResistanceData, TimingSignals, MultiTimeframeData, MarketData } from '@/types'

interface AuthUser {
  id: string
  email?: string
}

export default function SupportResistance() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedETF, setSelectedETF] = useState<'SPY' | 'IWM'>('SPY')
  const [multiTimeframeData, setMultiTimeframeData] = useState<MultiTimeframeData | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadSupportResistanceData()
    }
  }, [selectedETF, user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const loadSupportResistanceData = async () => {
    const today = new Date().toISOString().split('T')[0]
    console.log('Loading S/R data for:', selectedETF, 'on date:', today)
    
    const { data: srData, error: srError } = await supabase
      .from('support_resistance_data')
      .select('*')
      .eq('date', today)
      .eq('symbol', selectedETF)

    console.log('S/R data result:', srData, 'error:', srError)

    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .eq('date', today)
      .eq('symbol', selectedETF)

    console.log('Market data result:', marketData, 'error:', marketError)

    if (srData && srData.length > 0 && marketData && marketData.length > 0) {
      const selectedSR = srData[0]
      const selectedMarket = marketData[0]
      
      console.log('Found data, calculating timing signals')
      const timingSignals = calculateTimingSignals(selectedMarket, selectedSR)
      
      setMultiTimeframeData({
        daily_rsi: selectedMarket.rsi_14 || 50,
        daily_macd: selectedMarket.macd_line || 0,
        current_price: selectedMarket.close_price,
        support_resistance: selectedSR,
        timing_signals: timingSignals
      })
    } else {
      console.log('No data found, setting multiTimeframeData to null')
      setMultiTimeframeData(null)
    }
  }

  const calculateTimingSignals = (marketData: MarketData, srData: SupportResistanceData): TimingSignals => {
    const currentPrice = marketData.close_price
    const rsi = marketData.rsi_14 || 50
    const macdLine = marketData.macd_line || 0
    const macdSignal = marketData.macd_signal || 0
    
    const rsi_oversold = rsi < 30
    const rsi_overbought = rsi > 70
    const macd_bullish_cross = macdLine > macdSignal && Math.abs(macdLine - macdSignal) < 0.01
    const macd_bearish_cross = macdLine < macdSignal && Math.abs(macdLine - macdSignal) < 0.01
    
    const supportLevels = [srData.support_1, srData.support_2, srData.support_3]
    const resistanceLevels = [srData.resistance_1, srData.resistance_2, srData.resistance_3]
    
    const near_support = supportLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.005)
    const near_resistance = resistanceLevels.some(level => Math.abs(currentPrice - level) / currentPrice < 0.005)
    
    let entry_signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
    
    if (rsi_oversold && near_support && macd_bullish_cross) {
      entry_signal = 'BUY'
    } else if (rsi_overbought && near_resistance && macd_bearish_cross) {
      entry_signal = 'SELL'
    }
    
    return {
      rsi_oversold,
      rsi_overbought,
      macd_bullish_cross,
      macd_bearish_cross,
      near_support,
      near_resistance,
      entry_signal
    }
  }

  const handleCalculateSR = async () => {
    setCalculating(true)
    setMessage('')

    try {
      const response = await fetch('/api/calculate-support-resistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to calculate support/resistance')
      const result = await response.json()
      
      if (result.success) {
        setMessage('Support/Resistance levels calculated successfully!')
        setTimeout(() => loadSupportResistanceData(), 500)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error calculating levels: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCalculating(false)
    }
  }

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return 'bg-green-100 text-green-800'
      case 'SELL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignalIcon = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />
      case 'SELL': return <TrendingDown className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Support &amp; Resistance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Trading Levels & Timing Signals</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pivot points, Fibonacci retracements, and entry/exit timing for SPY and IWM
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={handleCalculateSR}
                disabled={calculating}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-4 h-4" />
                <span>{calculating ? 'Calculating...' : 'Calculate S/R Levels'}</span>
              </button>

              <select
                value={selectedETF}
                onChange={(e) => {
                  setSelectedETF(e.target.value as 'SPY' | 'IWM')
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SPY">SPY</option>
                <option value="IWM">IWM</option>
              </select>
            </div>

            {message && (
              <div className={`p-3 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {multiTimeframeData && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Entry Signal</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getSignalColor(multiTimeframeData.timing_signals.entry_signal)}`}>
                      {getSignalIcon(multiTimeframeData.timing_signals.entry_signal)}
                      <span className="ml-2">{multiTimeframeData.timing_signals.entry_signal}</span>
                    </span>
                    <div className="text-sm text-gray-600">
                      Current Price: ${multiTimeframeData.current_price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-lg font-medium text-red-800 mb-3">Resistance Levels</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">R3:</span>
                        <span className="font-mono text-red-900">${multiTimeframeData.support_resistance.resistance_3.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">R2:</span>
                        <span className="font-mono text-red-900">${multiTimeframeData.support_resistance.resistance_2.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">R1:</span>
                        <span className="font-mono text-red-900">${multiTimeframeData.support_resistance.resistance_1.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-medium text-green-800 mb-3">Support Levels</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">S1:</span>
                        <span className="font-mono text-green-900">${multiTimeframeData.support_resistance.support_1.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">S2:</span>
                        <span className="font-mono text-green-900">${multiTimeframeData.support_resistance.support_2.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">S3:</span>
                        <span className="font-mono text-green-900">${multiTimeframeData.support_resistance.support_3.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-700 mb-2">Pivot Point</h3>
                    <p className="text-xl font-bold text-blue-900">${multiTimeframeData.support_resistance.pivot_point.toFixed(2)}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-700 mb-2">Fibonacci 61.8%</h3>
                    <p className="text-xl font-bold text-purple-900">${multiTimeframeData.support_resistance.fibonacci_618.toFixed(2)}</p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-700 mb-2">Volume POC</h3>
                    <p className="text-xl font-bold text-yellow-900">${multiTimeframeData.support_resistance.volume_profile_poc.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">RSI (14)</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-gray-900">{multiTimeframeData.daily_rsi.toFixed(1)}</span>
                      <div className="flex space-x-2">
                        {multiTimeframeData.timing_signals.rsi_oversold && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Oversold
                          </span>
                        )}
                        {multiTimeframeData.timing_signals.rsi_overbought && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overbought
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">MACD</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-gray-900">{multiTimeframeData.daily_macd.toFixed(3)}</span>
                      <div className="flex space-x-2">
                        {multiTimeframeData.timing_signals.macd_bullish_cross && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Bullish Cross
                          </span>
                        )}
                        {multiTimeframeData.timing_signals.macd_bearish_cross && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Bearish Cross
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!multiTimeframeData && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No S/R Data Available</h3>
                <p className="text-gray-600 mb-4">
                  Click &quot;Calculate S/R Levels&quot; to generate support/resistance analysis for {selectedETF}.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
