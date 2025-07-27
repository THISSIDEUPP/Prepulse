'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/supabase/client'
import { DailyPulse } from '@/types'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface AuthUser {
  id: string
  email?: string
}

export default function Home() {
  const [pulse, setPulse] = useState<DailyPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    checkUser()
    fetchTodaysPulse()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchTodaysPulse = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_pulses')
      .select('*')
      .eq('date', today)
      .single()

    if (data) {
      setPulse(data)
    }
    setLoading(false)
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
          <p className="mt-4 text-slate-300">Loading market pulse...</p>
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
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  P
                </div>
                <h1 className="text-2xl font-bold gradient-text">PrePulse</h1>
              </div>
            </div>
            <nav className="flex space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-slate-300 self-center">Welcome, {user.email}</span>
                  <Link href="/short-interest" className="btn-glass">
                    Short Interest
                  </Link>
                  <Link href="/support-resistance" className="btn-glass">
                    S/R Levels
                  </Link>
                  <Link href="/admin" className="btn-primary-glass">
                    Admin
                  </Link>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="btn-glass"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth" className="btn-primary-glass">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6">
        {pulse ? (
          <>
            <div className="glass p-8 text-center mb-8">
              <h2 className="text-4xl font-bold gradient-text mb-2">
                Today&apos;s Market Pulse
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                {new Date(pulse.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl">
                    📈
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">Market Strength</h3>
                  <p className="text-3xl font-bold vibrant-text mb-3">{pulse.market_strength}</p>
                  {pulse.market_strength && (
                    <div className={pulse.market_strength === 'BULLISH' ? 'status-bullish' : 'status-bearish'}>
                      {pulse.market_strength === 'BULLISH' ? 'Strong Momentum' : 'Weak Momentum'}
                    </div>
                  )}
                </div>

                <div className="glass-card p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl">
                    🔄
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">SPY/IWM Rotation</h3>
                  <p className="text-3xl font-bold vibrant-text mb-3">{pulse.spy_iwm_rotation.replace('_', ' ')}</p>
                  <p className="text-slate-400 text-sm">
                    {pulse.spy_iwm_rotation === 'SPY_LEADING' ? 'Large caps outperforming' : 
                     pulse.spy_iwm_rotation === 'IWM_LEADING' ? 'Small caps outperforming' : 
                     'Market rotation analysis'}
                  </p>
                </div>

                <div className="glass-card p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-2xl">
                    📊
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">Breadth Score</h3>
                  <p className="text-3xl font-bold vibrant-text mb-3">{pulse.breadth_score}</p>
                  <div className="progress-bar mt-3">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${pulse.breadth_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="glass p-6">
                <h3 className="text-2xl font-bold gradient-text mb-4">Leading Sector</h3>
                <p className="text-xl font-medium text-green-400">{pulse.leading_sector}</p>
              </div>

              <div className="glass p-6">
                <h3 className="text-2xl font-bold gradient-text mb-4">Lagging Sector</h3>
                <p className="text-xl font-medium text-red-400">{pulse.lagging_sector}</p>
              </div>
            </div>

            <div className="glass p-6 mb-8">
              <h3 className="text-2xl font-bold gradient-text mb-4">Market Summary</h3>
              <p className="text-slate-300 leading-relaxed">{pulse.summary}</p>
            </div>
          </>
        ) : (
          <div className="glass p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold gradient-text mb-2">No Pulse Data Available</h2>
            <p className="text-slate-300 mb-6">
              Today&apos;s market pulse hasn&apos;t been published yet. Check back before market open.
            </p>
            {user && (
              <Link
                href="/admin"
                className="btn-primary-glass inline-block px-6 py-3 font-medium"
              >
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
