'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart3, Mail, Lock, Info } from 'lucide-react'
import Link from 'next/link'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    setIsDemoMode(supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder'))
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        if (isDemoMode) {
          setMessage('Demo mode: Account created successfully! You can now sign in.')
          setIsSignUp(false)
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      if (errorMessage.includes('fetch')) {
        setMessage('Connection error. Please check your Supabase configuration or use demo mode.')
      } else {
        setMessage(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="floating-elements">
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold gradient-text">PrePulse</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold gradient-text">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          {isSignUp ? 'Already have an account?' : "Don&apos;t have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium vibrant-text hover:opacity-80 transition-opacity"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass py-8 px-4 sm:px-10">
          {isDemoMode && (
            <div className="mb-4 glass-card p-3 border-blue-400/50">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-300" />
                <p className="text-sm text-blue-200">
                  <strong>Demo Mode:</strong> Using mock authentication. Any email/password will work for testing.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-card appearance-none block w-full pl-10 pr-3 py-2 placeholder-slate-400 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-card appearance-none block w-full pl-10 pr-3 py-2 placeholder-slate-400 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {message && (
              <div className={`glass-card p-3 ${message.includes('Check your email') ? 'border-green-400/50 text-green-300' : 'border-red-400/50 text-red-300'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-glass w-full flex justify-center py-2 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/30"></div>
                ) : (
                  isSignUp ? 'Sign up' : 'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
