'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../supabase/client'
import { useRouter } from 'next/navigation'
import { Calculator, ArrowLeft, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { FVSResult, FVSFormData } from '../../types'

interface AuthUser {
  id: string
  email?: string
}

export default function FairValueScanner() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<FVSResult | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FVSFormData>({
    ticker: '',
    strike: '',
    expiry: '',
    type: 'call'
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log(`Form input changed: ${name} = ${value}`)
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    setScanning(true)
    setError('')
    setResult(null)

    try {
      const params = new URLSearchParams({
        ticker: formData.ticker.toUpperCase(),
        strike: formData.strike,
        expiry: formData.expiry,
        type: formData.type
      })

      console.log('API request params:', params.toString())
      const response = await fetch(`/api/fvs?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate fair value')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while scanning')
    } finally {
      setScanning(false)
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Underpriced':
        return 'text-green-400 border-green-400/50'
      case 'Overpriced':
        return 'text-red-400 border-red-400/50'
      case 'Fairly Priced':
        return 'text-blue-400 border-blue-400/50'
      default:
        return 'text-slate-400 border-slate-400/50'
    }
  }

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Underpriced':
        return <TrendingDown className="w-4 h-4" />
      case 'Overpriced':
        return <TrendingUp className="w-4 h-4" />
      case 'Fairly Priced':
        return <Target className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
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
          <p className="text-slate-300">Loading Fair Value Scanner...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Fair Value Scanner</h1>
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
            <h2 className="text-xl font-semibold gradient-text">Options Fair Value Analysis</h2>
            <p className="text-sm text-slate-300 mt-1">
              Calculate theoretical fair value using Black-Scholes model and compare with market prices
            </p>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ticker Symbol
                  </label>
                  <input
                    type="text"
                    name="ticker"
                    value={formData.ticker}
                    onChange={handleInputChange}
                    placeholder="e.g., AAPL"
                    className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Strike Price
                  </label>
                  <input
                    type="number"
                    name="strike"
                    value={formData.strike}
                    onChange={handleInputChange}
                    placeholder="e.g., 150"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 glass-card text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 glass-card text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Option Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 glass-card text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  >
                    <option value="call" className="bg-slate-800 text-slate-200">Call</option>
                    <option value="put" className="bg-slate-800 text-slate-200">Put</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="btn-primary-glass flex items-center space-x-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-4 h-4" />
                <span>{scanning ? 'Scanning...' : 'Scan Fair Value'}</span>
              </button>
            </form>

            {error && (
              <div className="glass-card p-4 border-red-400/50">
                <div className="flex items-center space-x-2 text-red-300">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold gradient-text">
                      {result.ticker} ${result.strike}{result.option_type === 'call' ? 'C' : 'P'} Exp {result.expiry}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium glass-card ${getTagColor(result.tag)}`}>
                      {getTagIcon(result.tag)}
                      <span className="ml-1">{result.tag}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Spot Price</h4>
                      <p className="text-2xl font-bold vibrant-text">${result.spot_price}</p>
                      <p className="text-sm text-slate-400">Current Stock</p>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Market Price</h4>
                      <p className="text-2xl font-bold vibrant-text">${result.market_price}</p>
                      <p className="text-sm text-slate-400">Option Premium</p>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Fair Value</h4>
                      <p className="text-2xl font-bold gradient-text">${result.fair_value}</p>
                      <p className="text-sm text-slate-400">Black-Scholes</p>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Time to Expiry</h4>
                      <p className="text-2xl font-bold vibrant-text">{result.time_to_expiration}</p>
                      <p className="text-sm text-slate-400">Days</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Implied Volatility: {(result.implied_volatility * 100).toFixed(1)}%</span>
                      <span className="text-slate-400">
                        Difference: ${Math.abs(result.market_price - result.fair_value).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!result && !error && !scanning && (
              <div className="text-center py-12">
                <Calculator className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium gradient-text mb-2">Ready to Scan</h3>
                <p className="text-slate-300 mb-4">
                  Enter option details above to calculate fair value and identify pricing opportunities.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
