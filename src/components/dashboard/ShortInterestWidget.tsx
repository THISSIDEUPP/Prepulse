'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Download } from 'lucide-react'
import { ShortInterestData, ShortInterestSignals } from '@/types'
import { supabase } from '@/supabase/client'

interface ShortInterestWidgetProps {
  selectedETF: 'SPY' | 'IWM'
}

export default function ShortInterestWidget({ selectedETF }: ShortInterestWidgetProps) {
  const [shortData, setShortData] = useState<ShortInterestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    loadShortInterestData()
  }, [selectedETF])

  const loadShortInterestData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data } = await supabase
        .from('short_interest_data')
        .select('*')
        .eq('date', today)
        .eq('symbol', selectedETF)
        .single()

      setShortData(data)
    } catch {
      setShortData(null)
    }
    setLoading(false)
  }

  const handleFetchShortInterest = async () => {
    setFetching(true)
    try {
      const response = await fetch('/api/fetch-short-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadShortInterestData()
        }
      }
    } catch {
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

  const signals = shortData ? calculateSignals(shortData) : null

  if (loading) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold gradient-text mb-4">Short Interest</h3>
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
        <h3 className="text-lg font-semibold gradient-text">Short Interest</h3>
        <button
          onClick={handleFetchShortInterest}
          disabled={fetching}
          className="btn-glass text-xs px-2 py-1 flex items-center space-x-1 disabled:opacity-50"
        >
          <Download className="w-3 h-3" />
          <span>{fetching ? 'Fetching...' : 'Fetch'}</span>
        </button>
      </div>

      {shortData ? (
        <div className="space-y-4">
          {signals && (
            <div className="flex flex-wrap gap-1">
              {signals.elevated_short_interest && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium glass-card border-orange-400/50 text-orange-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Elevated
                </span>
              )}
              {signals.cooling_shorts && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium glass-card border-blue-400/50 text-blue-300">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Cooling
                </span>
              )}
              {signals.squeeze_watch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium glass-card border-red-400/50 text-red-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Squeeze
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div className="glass-card p-3">
              <h4 className="text-xs font-medium text-slate-300 mb-1">Short Interest Ratio</h4>
              <p className="text-lg font-bold vibrant-text">{shortData.short_interest_ratio}</p>
              <p className="text-xs text-slate-400">Days to Cover</p>
            </div>

            <div className="glass-card p-3">
              <h4 className="text-xs font-medium text-slate-300 mb-1">% of Float</h4>
              <p className="text-lg font-bold vibrant-text">{shortData.short_interest_percent_float}%</p>
              <p className="text-xs text-slate-400">Short Interest</p>
            </div>

            <div className="glass-card p-3">
              <h4 className="text-xs font-medium text-slate-300 mb-1">Shares Shorted</h4>
              <p className="text-lg font-bold vibrant-text">{(shortData.total_shares_shorted / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-slate-400">Total Shares</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300 mb-3">No short interest data</p>
          <button
            onClick={handleFetchShortInterest}
            disabled={fetching}
            className="btn-primary-glass text-xs px-3 py-1 disabled:opacity-50"
          >
            {fetching ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>
      )}
    </div>
  )
}
