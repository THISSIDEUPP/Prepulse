'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/supabase/client'
import { DailyPulse } from '@/types'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
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

  const getMarketStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'BULLISH':
        return <TrendingUp className="w-8 h-8 text-green-500" />
      case 'BEARISH':
        return <TrendingDown className="w-8 h-8 text-red-500" />
      default:
        return <Minus className="w-8 h-8 text-yellow-500" />
    }
  }

  const getMarketStrengthColor = (strength: string) => {
    switch (strength) {
      case 'BULLISH':
        return 'text-green-500 bg-green-50 border-green-200'
      case 'BEARISH':
        return 'text-red-500 bg-red-50 border-red-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading market pulse...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PrePulse</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  <Link
                    href="/admin"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pulse ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Today&apos;s Market Pulse
              </h2>
              <p className="text-gray-600">
                {new Date(pulse.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-lg border-2 ${getMarketStrengthColor(pulse.market_strength)}`}>
                <div className="flex items-center justify-center mb-4">
                  {getMarketStrengthIcon(pulse.market_strength)}
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">Market Strength</h3>
                <p className="text-2xl font-bold text-center">{pulse.market_strength}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">SPY/IWM Rotation</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {pulse.spy_iwm_rotation.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Breadth Score</h3>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{pulse.breadth_score}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${pulse.breadth_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Leading Sector</h3>
                <p className="text-xl font-medium text-green-600">{pulse.leading_sector}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Lagging Sector</h3>
                <p className="text-xl font-medium text-red-600">{pulse.lagging_sector}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Market Summary</h3>
              <p className="text-gray-700 leading-relaxed">{pulse.summary}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pulse Data Available</h2>
            <p className="text-gray-600 mb-6">
              Today&apos;s market pulse hasn&apos;t been published yet. Check back before market open.
            </p>
            {user && (
              <Link
                href="/admin"
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
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
