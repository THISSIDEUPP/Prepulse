'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart3, ArrowLeft, Download, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ShortInterestData, ShortInterestSignals } from '@/types'

interface AuthUser {
  id: string
  email?: string
}

export default function ShortInterest() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedETF, setSelectedETF] = useState<'SPY' | 'IWM'>('SPY')
  const [shortData, setShortData] = useState<ShortInterestData[]>([])
  const router = useRouter()

   useEffect(() => {
     checkUser()
     loadShortInterestData()
   }, [])

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    setLoading(false)
  }, [router])

  const loadShortInterestData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('short_interest_data')
      .select('*')
      .eq('date', today)
      .in('symbol', ['SPY', 'IWM'])

    if (data) {
      setShortData(data)
    }
  }, [])

  const handleFetchShortInterest = async () => {
    setFetching(true)
    setMessage('')

    try {
      const response = await fetch('/api/fetch-short-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to fetch short interest data')
      const result = await response.json()
      
      if (result.success) {
        setMessage('Short interest data fetched successfully!')
        
        const fetchedData = result.results
          .filter((r: { success: boolean; data?: unknown }) => r.success)
          .map((r: { success: boolean; data: unknown }) => r.data)
        
        setShortData(fetchedData)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFetching(false)
    }
  }

  const calculateSignals = (data: ShortInterestData): ShortInterestSignals => {
    const elevated = data.short_interest_percent_float > 20 && data.short_interest_ratio > 3
    const cooling = false
    const squeeze = elevated && cooling

    return {
      elevated_short_interest: elevated,
      cooling_shorts: cooling,
      squeeze_watch: squeeze
    }
  }

  const getSelectedData = () => {
    return shortData.find(d => d.symbol === selectedETF)
  }

  const selectedData = getSelectedData()
  const signals = selectedData ? calculateSignals(selectedData) : null

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
          <p className="text-slate-300">Loading Short Interest...</p>
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
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Short Interest</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold gradient-text">Short Interest Analysis</h2>
            <p className="text-sm text-slate-300 mt-1">
              Monitor short interest metrics and squeeze potential for SPY and IWM
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={handleFetchShortInterest}
                disabled={fetching}
                className="btn-primary-glass flex items-center space-x-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{fetching ? 'Fetching...' : 'Fetch Short Interest'}</span>
              </button>

              <select
                value={selectedETF}
                onChange={(e) => setSelectedETF(e.target.value as 'SPY' | 'IWM')}
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

            {selectedData && (
              <div className="space-y-6">
                {signals && (
                  <div className="flex flex-wrap gap-2">
                    {signals.elevated_short_interest && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium glass-card border-orange-400/50 text-orange-300">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Elevated Short Interest
                      </span>
                    )}
                    {signals.cooling_shorts && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium glass-card border-blue-400/50 text-blue-300">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        Cooling Shorts
                      </span>
                    )}
                    {signals.squeeze_watch && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium glass-card border-red-400/50 text-red-300">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Squeeze Watch
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Short Interest Ratio</h3>
                    <p className="text-2xl font-bold vibrant-text">{selectedData.short_interest_ratio}</p>
                    <p className="text-sm text-slate-400">Days to Cover</p>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">% of Float</h3>
                    <p className="text-2xl font-bold vibrant-text">{selectedData.short_interest_percent_float}%</p>
                    <p className="text-sm text-slate-400">Short Interest</p>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Total Shares Shorted</h3>
                    <p className="text-2xl font-bold vibrant-text">{(selectedData.total_shares_shorted / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-slate-400">Shares</p>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Last Report Date</h3>
                    <p className="text-lg font-bold gradient-text">
                      {new Date(selectedData.last_report_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-400">Updated</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedData && shortData.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium gradient-text mb-2">No Short Interest Data</h3>
                <p className="text-slate-300 mb-4">
                  Click &quot;Fetch Short Interest&quot; to load the latest data for SPY and IWM.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
