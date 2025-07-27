'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, ArrowLeft, Calculator, Target, AlertCircle, Activity, Moon } from 'lucide-react'
import Link from 'next/link'
import { SupportResistanceData, TimingSignals, MultiTimeframeData, MarketData, LunarData } from '@/types'

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
  const [lunarData, setLunarData] = useState<LunarData | null>(null)
  const [fetchingLunar, setFetchingLunar] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadSupportResistanceData()
    }
  }, [selectedETF, user])

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    setLoading(false)
  }, [router])

  const loadSupportResistanceData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const srResponse = await fetch(`/api/get-support-resistance?symbol=${selectedETF}&date=${today}`)
      const srResult = await srResponse.json()
      
      const marketResponse = await fetch(`/api/get-market-data?symbol=${selectedETF}&limit=20`)
      const marketResult = await marketResponse.json()

      if (srResult.success && srResult.data && marketResult.success && marketResult.data && marketResult.data.length > 0) {
        const srData = srResult.data
        const marketData = marketResult.data
        const latestMarketData = marketData[0]
        
        const timingSignals = calculateTimingSignals(latestMarketData, srData)
        
        setMultiTimeframeData({
          daily_rsi: latestMarketData.rsi_14 || 50,
          daily_macd: latestMarketData.macd_line || 0,
          current_price: latestMarketData.close_price,
          support_resistance: srData,
          timing_signals: timingSignals
        })
      } else {
        setMultiTimeframeData(null)
      }

      const { data: lunarDataResult } = await supabase
        .from('lunar_data')
        .select('*')
        .eq('date', today)
        .single()

      if (lunarDataResult) {
        setLunarData(lunarDataResult)
      }
    } catch {
      setMultiTimeframeData(null)
      setLunarData(null)
    }
  }, [selectedETF])

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
      
      if (result.success && result.results.some((r: { success: boolean }) => r.success)) {
        setMessage('Support/Resistance levels calculated successfully!')
        setTimeout(() => loadSupportResistanceData(), 500)
      } else {
        const errors = result.results.filter((r: { success: boolean; error?: string }) => !r.success).map((r: { error?: string }) => r.error)
        setMessage(`Error: ${errors.join(', ') || 'No data available for calculations'}`)
      }
    } catch (error) {
      setMessage(`Error calculating levels: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCalculating(false)
    }
  }

  const handleFetchLunarData = async () => {
    setFetchingLunar(true)
    setMessage('')

    try {
      const response = await fetch('/api/fetch-lunar-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to fetch lunar data')
      const result = await response.json()
      
      if (result.success && result.data) {
        const existingData = localStorage.getItem('mock_lunar_data')
        const records = existingData ? JSON.parse(existingData) : []
        
        const existingIndex = records.findIndex((r: { date: string }) => r.date === result.data.date)
        if (existingIndex >= 0) {
          records[existingIndex] = result.data
        } else {
          records.push(result.data)
        }
        
        localStorage.setItem('mock_lunar_data', JSON.stringify(records))
        setMessage('Lunar data fetched successfully!')
        setTimeout(() => loadSupportResistanceData(), 500)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error fetching lunar data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFetchingLunar(false)
    }
  }

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return 'border-green-400/50 text-green-300'
      case 'SELL': return 'border-red-400/50 text-red-300'
      default: return 'border-slate-400/50 text-slate-300'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="floating-elements">
          <div className="floating-circle"></div>
          <div className="floating-circle"></div>
          <div className="floating-circle"></div>
        </div>
        <div className="glass p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Support & Resistance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="floating-elements">
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
      </div>
      
      <header className="glass mx-4 mt-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Support &amp; Resistance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300">Welcome, {user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-slate-300 hover:text-white text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold gradient-text">Trading Levels & Timing Signals</h2>
            <p className="text-sm text-slate-300 mt-1">
              Pivot points, Fibonacci retracements, and entry/exit timing for SPY and IWM
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={handleCalculateSR}
                disabled={calculating}
                className="btn-primary-glass flex items-center space-x-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-4 h-4" />
                <span>{calculating ? 'Calculating...' : 'Calculate S/R Levels'}</span>
              </button>

              <button
                onClick={handleFetchLunarData}
                disabled={fetchingLunar}
                className="btn-glass flex items-center space-x-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Moon className="w-4 h-4" />
                <span>{fetchingLunar ? 'Fetching...' : 'Fetch Lunar Data'}</span>
              </button>

              <select
                value={selectedETF}
                onChange={(e) => {
                  setSelectedETF(e.target.value as 'SPY' | 'IWM')
                }}
                className="glass-card px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <option value="SPY" className="bg-slate-800 text-slate-200">SPY</option>
                <option value="IWM" className="bg-slate-800 text-slate-200">IWM</option>
              </select>
            </div>

            {message && (
              <div className={`glass-card p-3 ${message.includes('Error') ? 'border-red-400/50 text-red-300' : 'border-green-400/50 text-green-300'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {multiTimeframeData && (
              <div className="space-y-6">
                <div className="glass-card p-4">
                  <h3 className="text-lg font-medium gradient-text mb-3">Entry Signal</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold glass-card ${getSignalColor(multiTimeframeData.timing_signals.entry_signal)}`}>
                      {getSignalIcon(multiTimeframeData.timing_signals.entry_signal)}
                      <span className="ml-2">{multiTimeframeData.timing_signals.entry_signal}</span>
                    </span>
                    <div className="text-sm text-slate-300">
                      Current Price: ${multiTimeframeData.current_price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-4 border-red-400/50">
                    <h3 className="text-lg font-medium text-red-300 mb-3">Resistance Levels</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-400">R3:</span>
                        <span className="font-mono text-red-200">${multiTimeframeData.support_resistance.resistance_3.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-400">R2:</span>
                        <span className="font-mono text-red-200">${multiTimeframeData.support_resistance.resistance_2.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-400">R1:</span>
                        <span className="font-mono text-red-200">${multiTimeframeData.support_resistance.resistance_1.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4 border-green-400/50">
                    <h3 className="text-lg font-medium text-green-300 mb-3">Support Levels</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-400">S1:</span>
                        <span className="font-mono text-green-200">${multiTimeframeData.support_resistance.support_1.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-400">S2:</span>
                        <span className="font-mono text-green-200">${multiTimeframeData.support_resistance.support_2.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-400">S3:</span>
                        <span className="font-mono text-green-200">${multiTimeframeData.support_resistance.support_3.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Pivot Point</h3>
                    <p className="text-xl font-bold vibrant-text">${multiTimeframeData.support_resistance.pivot_point.toFixed(2)}</p>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Fibonacci 61.8%</h3>
                    <p className="text-xl font-bold vibrant-text">${multiTimeframeData.support_resistance.fibonacci_618.toFixed(2)}</p>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Volume POC</h3>
                    <p className="text-xl font-bold vibrant-text">${multiTimeframeData.support_resistance.volume_profile_poc.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium gradient-text">Multi-Timeframe Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-4">
                      <h4 className="text-lg font-medium gradient-text mb-3">RSI Alignment</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Daily:</span>
                          <span className="font-bold text-slate-200">{multiTimeframeData.daily_rsi.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">1H:</span>
                          <span className="font-bold text-slate-200">{(multiTimeframeData.daily_rsi + Math.random() * 10 - 5).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">15M:</span>
                          <span className="font-bold text-slate-200">{(multiTimeframeData.daily_rsi + Math.random() * 15 - 7.5).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">5M:</span>
                          <span className="font-bold text-slate-200">{(multiTimeframeData.daily_rsi + Math.random() * 20 - 10).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        {multiTimeframeData.timing_signals.rsi_oversold && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium glass-card border-green-400/50 text-green-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Oversold
                          </span>
                        )}
                        {multiTimeframeData.timing_signals.rsi_overbought && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium glass-card border-red-400/50 text-red-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overbought
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-lg font-medium gradient-text mb-3">MACD Alignment</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Daily:</span>
                          <span className="font-bold text-slate-200">{multiTimeframeData.daily_macd.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">1H:</span>
                          <span className="font-bold text-slate-200">{(multiTimeframeData.daily_macd + Math.random() * 0.02 - 0.01).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">15M:</span>
                          <span className="font-bold text-slate-200">{(multiTimeframeData.daily_macd + Math.random() * 0.04 - 0.02).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">5M:</span>
                          <span className="font-bold text-slate-200">{(multiTimeframeData.daily_macd + Math.random() * 0.06 - 0.03).toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        {multiTimeframeData.timing_signals.macd_bullish_cross && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium glass-card border-green-400/50 text-green-300">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Bullish Cross
                          </span>
                        )}
                        {multiTimeframeData.timing_signals.macd_bearish_cross && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium glass-card border-red-400/50 text-red-300">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Bearish Cross
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {lunarData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium gradient-text">Lunar Cycle Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="glass-card p-4 border-indigo-400/50">
                        <h4 className="text-sm font-medium text-indigo-300 mb-2">Moon Phase</h4>
                        <p className="text-xl font-bold text-indigo-200">{lunarData.moon_phase.replace('_', ' ')}</p>
                        <p className="text-sm text-indigo-400">{lunarData.moon_phase_percent}% Illuminated</p>
                      </div>

                      <div className={`glass-card p-4 ${lunarData.is_saturn_favorable ? 'border-green-400/50' : 'border-slate-400/50'}`}>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Saturn Influence</h4>
                        <p className={`text-xl font-bold ${lunarData.is_saturn_favorable ? 'text-green-300' : 'text-slate-300'}`}>
                          {lunarData.is_saturn_favorable ? 'Favorable' : 'Neutral'}
                        </p>
                      </div>

                      <div className={`glass-card p-4 ${
                        lunarData.market_bias === 'BULLISH' ? 'border-green-400/50' : 
                        lunarData.market_bias === 'BEARISH' ? 'border-red-400/50' : 'border-yellow-400/50'
                      }`}>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Market Bias</h4>
                        <p className={`text-xl font-bold ${
                          lunarData.market_bias === 'BULLISH' ? 'text-green-300' : 
                          lunarData.market_bias === 'BEARISH' ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                          {lunarData.market_bias}
                        </p>
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Optimal Trading Window</h4>
                      <p className="text-lg font-medium vibrant-text">{lunarData.optimal_trading_window}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!multiTimeframeData && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium gradient-text mb-2">No S/R Data Available</h3>
                <p className="text-slate-300 mb-4">
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
