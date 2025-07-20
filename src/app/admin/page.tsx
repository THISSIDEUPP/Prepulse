'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart3, Save, Send, ArrowLeft, Download, Zap, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { MarketData } from '@/types'

interface AuthUser {
  id: string
  email?: string
}

export default function Admin() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const router = useRouter()

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    spy_iwm_rotation: 'NEUTRAL' as 'SPY_LEADING' | 'IWM_LEADING' | 'NEUTRAL',
    breadth_score: 50,
    leading_sector: '',
    lagging_sector: '',
    market_strength: 'NEUTRAL' as 'BULLISH' | 'NEUTRAL' | 'BEARISH',
    summary: ''
  })

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    setLoading(false)
    
    loadTodaysPulse()
  }, [router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const loadTodaysPulse = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: pulseData } = await supabase
      .from('daily_pulses')
      .select('*')
      .eq('date', today)
      .single()

    if (pulseData) {
      setFormData({
        date: pulseData.date,
        spy_iwm_rotation: pulseData.spy_iwm_rotation,
        breadth_score: pulseData.breadth_score,
        leading_sector: pulseData.leading_sector,
        lagging_sector: pulseData.lagging_sector,
        market_strength: pulseData.market_strength,
        summary: pulseData.summary
      })
    }

    const { data: marketData } = await supabase
      .from('market_data')
      .select('*')
      .eq('date', today)
      .in('symbol', ['SPY', 'IWM'])
      .order('symbol')

    if (marketData) {
      setMarketData(marketData)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('daily_pulses')
        .upsert({
          ...formData,
          created_by: user?.id || ''
        })

      if (error) throw error
      setMessage('Pulse saved successfully!')
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleFetchMarketData = async () => {
    setFetching(true)
    setMessage('')

    try {
      const response = await fetch('/api/fetch-market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to fetch market data')
      const result = await response.json()
      
      if (result.success) {
        setMessage('Market data fetched successfully!')
        
        const fetchedMarketData = result.results
          .filter((r: { success: boolean; data?: unknown }) => r.success)
          .map((r: { success: boolean; data: unknown }) => r.data)
        
        console.log('Fetched market data:', fetchedMarketData)
        setMarketData(fetchedMarketData)
        console.log('Market data state should be updated')
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFetching(false)
    }
  }

  const handleGeneratePulse = async () => {
    setGenerating(true)
    setMessage('')

    try {
      const response = await fetch('/api/generate-pulse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketData })
      })

      if (!response.ok) throw new Error('Failed to generate pulse')
      const result = await response.json()
      
      if (result.success) {
        setMessage('Pulse generated successfully!')
        loadTodaysPulse()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error generating pulse: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleSendEmail = async () => {
    setSending(true)
    setMessage('')

    try {
      const response = await fetch('/api/send-pulse-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to send email')
      setMessage('Email sent successfully!')
    } catch (error) {
      setMessage(`Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSending(false)
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
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PrePulse Admin</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Daily Market Pulse Entry</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter today&apos;s market analysis and send alerts to subscribers
            </p>
          </div>

          <div className="p-6 space-y-6">
            {marketData.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Today&apos;s Market Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketData.map((data) => (
                    <div key={data.symbol} className="bg-white p-3 rounded border">
                      <h4 className="font-semibold text-gray-800">{data.symbol}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Open: ${data.open_price.toFixed(2)} | Close: ${data.close_price.toFixed(2)}</div>
                        <div>High: ${data.high_price.toFixed(2)} | Low: ${data.low_price.toFixed(2)}</div>
                        <div>Volume: {(data.volume / 1000000).toFixed(1)}M</div>
                        {data.rsi_14 && <div>RSI(14): {data.rsi_14.toFixed(1)}</div>}
                        {data.macd_line && <div>MACD: {data.macd_line.toFixed(3)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4 mb-6">
              <button
                onClick={handleFetchMarketData}
                disabled={fetching}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{fetching ? 'Fetching...' : 'Fetch Market Data'}</span>
              </button>

              <button
                onClick={handleGeneratePulse}
                disabled={generating || marketData.length === 0}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>{generating ? 'Generating...' : 'Auto-Generate Pulse'}</span>
              </button>

              <button
                onClick={loadTodaysPulse}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Strength
                </label>
                <select
                  value={formData.market_strength}
                  onChange={(e) => setFormData({ ...formData, market_strength: e.target.value as 'BULLISH' | 'NEUTRAL' | 'BEARISH' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BULLISH">Bullish</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="BEARISH">Bearish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SPY/IWM Rotation
                </label>
                <select
                  value={formData.spy_iwm_rotation}
                  onChange={(e) => setFormData({ ...formData, spy_iwm_rotation: e.target.value as 'SPY_LEADING' | 'IWM_LEADING' | 'NEUTRAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SPY_LEADING">SPY Leading</option>
                  <option value="IWM_LEADING">IWM Leading</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breadth Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.breadth_score}
                  onChange={(e) => setFormData({ ...formData, breadth_score: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leading Sector
                </label>
                <input
                  type="text"
                  value={formData.leading_sector}
                  onChange={(e) => setFormData({ ...formData, leading_sector: e.target.value })}
                  placeholder="e.g., Technology, Healthcare"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lagging Sector
                </label>
                <input
                  type="text"
                  value={formData.lagging_sector}
                  onChange={(e) => setFormData({ ...formData, lagging_sector: e.target.value })}
                  placeholder="e.g., Energy, Utilities"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market Summary
              </label>
              <textarea
                rows={6}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Enter detailed market analysis and key insights for traders..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Pulse'}</span>
              </button>

              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send Email Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
