'use client'

import React from 'react'
import { DailyPulse } from '@/types'
import { BarChart3 } from 'lucide-react'

interface MarketPulseWidgetProps {
  pulse: DailyPulse | null
}

export default function MarketPulseWidget({ pulse }: MarketPulseWidgetProps) {
  if (!pulse) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold gradient-text mb-4">Today&apos;s Market Pulse</h3>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300">No pulse data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold gradient-text">Today&apos;s Market Pulse</h3>
        <p className="text-sm text-slate-400">
          {new Date(pulse.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-xl">
            📈
          </div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">Market Strength</h4>
          <p className="text-xl font-bold vibrant-text">{pulse.market_strength}</p>
          {pulse.market_strength && (
            <div className={pulse.market_strength === 'BULLISH' ? 'status-bullish' : 'status-bearish'}>
              {pulse.market_strength === 'BULLISH' ? 'Strong Momentum' : 'Weak Momentum'}
            </div>
          )}
        </div>
        
        <div className="glass-card p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-xl">
            🔄
          </div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">SPY/IWM Rotation</h4>
          <p className="text-xl font-bold vibrant-text">{pulse.spy_iwm_rotation.replace('_', ' ')}</p>
          <p className="text-slate-400 text-xs mt-1">
            {pulse.spy_iwm_rotation === 'SPY_LEADING' ? 'Large caps outperforming' : 
             pulse.spy_iwm_rotation === 'IWM_LEADING' ? 'Small caps outperforming' : 
             'Market rotation analysis'}
          </p>
        </div>
        
        <div className="glass-card p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-xl">
            📊
          </div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">Breadth Score</h4>
          <p className="text-xl font-bold vibrant-text">{pulse.breadth_score}</p>
          <div className="progress-bar mt-2">
            <div 
              className="progress-fill" 
              style={{ width: `${pulse.breadth_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Leading Sector</h4>
          <p className="text-lg font-semibold text-green-400">{pulse.leading_sector}</p>
        </div>
        <div className="glass-card p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Lagging Sector</h4>
          <p className="text-lg font-semibold text-red-400">{pulse.lagging_sector}</p>
        </div>
      </div>

      {pulse.summary && (
        <div className="mt-4 glass-card p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Market Summary</h4>
          <p className="text-slate-300 text-sm leading-relaxed">{pulse.summary}</p>
        </div>
      )}
    </div>
  )
}
