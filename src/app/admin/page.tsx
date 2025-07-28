'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart3, Save, Send, ArrowLeft, Download, Zap, RefreshCw, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { MarketData } from '@/types'
import { n8nClient, N8nWorkflow } from '@/lib/n8n-client'

interface AuthUser {
  id: string
  email?: string
  role?: 'admin' | 'user'
}

export default function Admin() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([])
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
    
    if (user.role !== 'admin') {
      setMessage('Access denied. Admin privileges required.')
      setLoading(false)
      setTimeout(() => router.push('/'), 3000)
      return
    }
    
    setUser(user as AuthUser)
    setLoading(false)
    
    loadTodaysPulse()
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUser()
      loadN8nWorkflows()
    }, 100)
    
    return () => clearTimeout(timer)
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
        body: JSON.stringify({ date: formData.date }),
      })

      if (!response.ok) throw new Error('Failed to fetch market data')
      const result = await response.json()
      
      if (result.success) {
        setMessage('Market data fetched successfully!')
        
        const fetchedMarketData = result.results
          .filter((r: { success: boolean; data?: unknown[] }) => r.success)
          .flatMap((r: { success: boolean; data: unknown[] }) => r.data)
          .filter((data: { date: string }) => data.date === formData.date)
        
        setMarketData(fetchedMarketData)
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

  const loadN8nWorkflows = async () => {
    try {
      const workflows = await n8nClient.getWorkflows()
      setN8nWorkflows(workflows)
    } catch (error) {
      console.error('Error loading n8n workflows:', error)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading admin panel...</p>
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
      
      <header className="glass mx-6 mt-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="btn-glass flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <Link href="/short-interest" className="btn-glass">
                <span className="text-sm">Short Interest</span>
              </Link>
              <Link href="/support-resistance" className="btn-glass">
                <span className="text-sm">S/R Levels</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">PrePulse Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300">Welcome, {user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="btn-glass text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="glass">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold gradient-text">Daily Market Pulse Entry</h2>
            <p className="text-sm text-slate-300 mt-1">
              Enter today&apos;s market analysis and send alerts to subscribers
            </p>
          </div>

          <div className="p-6 space-y-6">
            {marketData.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-lg font-medium gradient-text mb-3">Market Data for {formData.date}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketData.map((data) => (
                    <div key={data.symbol} className="glass-card p-3">
                      <h4 className="font-semibold text-slate-200">{data.symbol}</h4>
                      <div className="text-sm text-slate-300 space-y-1">
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
                className="btn-primary-glass flex items-center space-x-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{fetching ? 'Fetching...' : 'Fetch Market Data'}</span>
              </button>

              <button
                onClick={handleGeneratePulse}
                disabled={generating || marketData.length === 0}
                className="btn-glass flex items-center space-x-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              >
                <Zap className="w-4 h-4" />
                <span>{generating ? 'Generating...' : 'Auto-Generate Pulse'}</span>
              </button>

              <button
                onClick={loadTodaysPulse}
                className="btn-glass flex items-center space-x-2 px-4 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Market Strength
                </label>
                <select
                  value={formData.market_strength}
                  onChange={(e) => setFormData({ ...formData, market_strength: e.target.value as 'BULLISH' | 'NEUTRAL' | 'BEARISH' })}
                  className="w-full px-3 py-2 glass-card text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="BULLISH" className="bg-slate-800 text-slate-200">Bullish</option>
                  <option value="NEUTRAL" className="bg-slate-800 text-slate-200">Neutral</option>
                  <option value="BEARISH" className="bg-slate-800 text-slate-200">Bearish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SPY/IWM Rotation
                </label>
                <select
                  value={formData.spy_iwm_rotation}
                  onChange={(e) => setFormData({ ...formData, spy_iwm_rotation: e.target.value as 'SPY_LEADING' | 'IWM_LEADING' | 'NEUTRAL' })}
                  className="w-full px-3 py-2 glass-card text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="SPY_LEADING" className="bg-slate-800 text-slate-200">SPY Leading</option>
                  <option value="IWM_LEADING" className="bg-slate-800 text-slate-200">IWM Leading</option>
                  <option value="NEUTRAL" className="bg-slate-800 text-slate-200">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Breadth Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.breadth_score}
                  onChange={(e) => setFormData({ ...formData, breadth_score: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Leading Sector
                </label>
                <input
                  type="text"
                  value={formData.leading_sector}
                  onChange={(e) => setFormData({ ...formData, leading_sector: e.target.value })}
                  placeholder="e.g., Technology, Healthcare"
                  className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lagging Sector
                </label>
                <input
                  type="text"
                  value={formData.lagging_sector}
                  onChange={(e) => setFormData({ ...formData, lagging_sector: e.target.value })}
                  placeholder="e.g., Energy, Utilities"
                  className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Market Summary
              </label>
              <textarea
                rows={6}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Enter detailed market analysis and key insights for traders..."
                className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            {message && (
              <div className={`glass-card p-3 ${message.includes('Error') ? 'border-red-400/50 text-red-300' : 'border-green-400/50 text-green-300'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary-glass flex items-center space-x-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Pulse'}</span>
              </button>

              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="btn-glass flex items-center space-x-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send Email Alert'}</span>
              </button>
            </div>
          </div>

          {/* n8n Workflow Management */}
          <div className="glass p-6 mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold gradient-text mb-2">Automation Workflows</h2>
              <p className="text-sm text-slate-300">
                Manage n8n automation workflows for alerts and data processing
              </p>
            </div>
            
            <div className="space-y-4">
              {n8nWorkflows.length > 0 ? (
                n8nWorkflows.map((workflow) => (
                  <div key={workflow.id} className="glass-card p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">{workflow.name}</h3>
                      <p className="text-sm text-slate-300">
                        Status: <span className={workflow.active ? 'text-green-400' : 'text-red-400'}>
                          {workflow.active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => workflow.active ? 
                        n8nClient.deactivateWorkflow(workflow.id) : 
                        n8nClient.activateWorkflow(workflow.id)
                      }
                      className={`btn-glass px-3 py-1 text-sm flex items-center space-x-1 ${
                        workflow.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                      }`}
                    >
                      {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{workflow.active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="glass-card p-6 text-center">
                  <Zap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-300 mb-2">No n8n workflows found</p>
                  <p className="text-sm text-slate-400">
                    Start n8n server and import workflow templates to see automation options
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
