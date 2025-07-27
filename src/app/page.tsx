'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/supabase/client'
import { DailyPulse } from '@/types'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import {
  MarketPulseWidget,
  TradingSignalsWidget,
  ETFWatchlistWidget,
  ShortInterestWidget,
  SupportResistanceWidget,
  AdminQuickActions
} from '@/components/dashboard'

interface AuthUser {
  id: string
  email?: string
  role?: 'admin' | 'user'
}

export default function Home() {
  const [pulse, setPulse] = useState<DailyPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [selectedETF, setSelectedETF] = useState<'SPY' | 'IWM'>('SPY')

  useEffect(() => {
    checkUser()
    fetchTodaysPulse()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user as AuthUser)
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
          <p className="mt-4 text-slate-300">Loading trading dashboard...</p>
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
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">PrePulse</h1>
              </div>
            </div>
            <nav className="flex space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-slate-300 self-center">Welcome, {user.email}</span>
                  <Link href="/short-interest" className="btn-glass text-sm">
                    Short Interest
                  </Link>
                  <Link href="/support-resistance" className="btn-glass text-sm">
                    S/R Levels
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="btn-primary-glass text-sm">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="btn-glass text-sm"
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
        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <MarketPulseWidget pulse={pulse} />
              <TradingSignalsWidget selectedETF={selectedETF} />
              <SupportResistanceWidget selectedETF={selectedETF} />
            </div>
            
            <div className="space-y-6">
              <ETFWatchlistWidget selectedETF={selectedETF} setSelectedETF={setSelectedETF} />
              <ShortInterestWidget selectedETF={selectedETF} />
              {user.role === 'admin' && <AdminQuickActions />}
            </div>
          </div>
        ) : (
          <div className="glass p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold gradient-text mb-2">Welcome to PrePulse</h2>
            <p className="text-slate-300 mb-6">
              Your unified trading dashboard for SPY and IWM analysis.
            </p>
            <Link
              href="/auth"
              className="btn-primary-glass inline-block px-6 py-3 font-medium"
            >
              Sign In to Access Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
