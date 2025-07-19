'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart3, Save, Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AuthUser {
  id: string
  email?: string
}

export default function Admin() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
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
    const { data } = await supabase
      .from('daily_pulses')
      .select('*')
      .eq('date', today)
      .single()

    if (data) {
      setFormData({
        date: data.date,
        spy_iwm_rotation: data.spy_iwm_rotation,
        breadth_score: data.breadth_score,
        leading_sector: data.leading_sector,
        lagging_sector: data.lagging_sector,
        market_strength: data.market_strength,
        summary: data.summary
      })
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
