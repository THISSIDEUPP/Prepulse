'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Settings, Download, Zap, Send, RefreshCw } from 'lucide-react'

export default function AdminQuickActions() {
  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

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

      if (response.ok) {
        const result = await response.json()
        setMessage(result.success ? 'Market data fetched successfully!' : 'Error fetching market data')
      }
    } catch {
      setMessage('Error fetching market data')
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
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(result.success ? 'Pulse generated successfully!' : 'Error generating pulse')
      }
    } catch {
      setMessage('Error generating pulse')
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
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(result.success ? 'Email sent successfully!' : 'Error sending email')
      }
    } catch {
      setMessage('Error sending email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="glass p-6">
      <h3 className="text-lg font-semibold gradient-text mb-4">Admin Actions</h3>
      
      {message && (
        <div className={`glass-card p-2 mb-4 text-xs ${message.includes('Error') ? 'border-red-400/50 text-red-300' : 'border-green-400/50 text-green-300'}`}>
          {message}
        </div>
      )}
      
      <div className="space-y-3">
        <Link href="/admin" className="btn-glass w-full flex items-center space-x-2 justify-center text-sm py-2">
          <Settings className="w-4 h-4" />
          <span>Full Admin Panel</span>
        </Link>
        
        <button 
          onClick={handleFetchMarketData}
          disabled={fetching}
          className="btn-glass w-full flex items-center space-x-2 justify-center text-sm py-2 disabled:opacity-50"
        >
          {fetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{fetching ? 'Fetching...' : 'Fetch Market Data'}</span>
        </button>
        
        <button 
          onClick={handleGeneratePulse}
          disabled={generating}
          className="btn-glass w-full flex items-center space-x-2 justify-center text-sm py-2 disabled:opacity-50"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>{generating ? 'Generating...' : 'Generate Pulse'}</span>
        </button>
        
        <button 
          onClick={handleSendEmail}
          disabled={sending}
          className="btn-glass w-full flex items-center space-x-2 justify-center text-sm py-2 disabled:opacity-50"
        >
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{sending ? 'Sending...' : 'Send Email Alert'}</span>
        </button>
      </div>
    </div>
  )
}
