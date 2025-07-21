import { NextResponse } from 'next/server'
import { supabase } from '@/supabase/client'

interface LunarPhaseData {
  date: string
  phase: string
  illumination: number
}

function calculateMoonPhase(date: Date): { phase: string; illumination: number } {
  const lunarCycle = 29.53058867
  const knownNewMoon = new Date('2000-01-06T18:14:00Z')
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  const currentCycle = daysSinceKnownNewMoon / lunarCycle
  const phasePosition = (currentCycle - Math.floor(currentCycle)) * lunarCycle

  let phase: string
  let illumination: number

  if (phasePosition < 1.84566) {
    phase = 'NEW_MOON'
    illumination = 0
  } else if (phasePosition < 5.53699) {
    phase = 'WAXING_CRESCENT'
    illumination = 25
  } else if (phasePosition < 9.22831) {
    phase = 'FIRST_QUARTER'
    illumination = 50
  } else if (phasePosition < 12.91963) {
    phase = 'WAXING_GIBBOUS'
    illumination = 75
  } else if (phasePosition < 16.61096) {
    phase = 'FULL_MOON'
    illumination = 100
  } else if (phasePosition < 20.30228) {
    phase = 'WANING_GIBBOUS'
    illumination = 75
  } else if (phasePosition < 23.99361) {
    phase = 'LAST_QUARTER'
    illumination = 50
  } else {
    phase = 'WANING_CRESCENT'
    illumination = 25
  }

  return { phase, illumination }
}

function calculateSaturnInfluence(date: Date): boolean {
  const dayOfWeek = date.getDay()
  const dayOfMonth = date.getDate()
  
  return dayOfWeek === 6 || (dayOfMonth % 7 === 0)
}

function calculateMarketBias(phase: string, saturnFavorable: boolean): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  if (phase === 'NEW_MOON' && saturnFavorable) return 'BULLISH'
  if (phase === 'FULL_MOON') return 'BEARISH'
  if (phase === 'WAXING_CRESCENT' || phase === 'FIRST_QUARTER') return 'BULLISH'
  if (phase === 'WANING_GIBBOUS' || phase === 'LAST_QUARTER') return 'BEARISH'
  return 'NEUTRAL'
}

function calculateVolatilityForecast(phase: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (phase === 'FULL_MOON' || phase === 'NEW_MOON') return 'HIGH'
  if (phase === 'FIRST_QUARTER' || phase === 'LAST_QUARTER') return 'MEDIUM'
  return 'LOW'
}

function getOptimalTradingWindow(phase: string, saturnFavorable: boolean): string {
  if (phase === 'NEW_MOON' && saturnFavorable) return '9:30-10:30 AM EST (Saturn-aligned opening)'
  if (phase === 'FULL_MOON') return '3:00-4:00 PM EST (Reversal window)'
  if (phase === 'FIRST_QUARTER') return '10:00-11:00 AM EST (Momentum continuation)'
  if (phase === 'LAST_QUARTER') return '2:00-3:00 PM EST (Trend exhaustion)'
  return '10:30-11:30 AM EST (Standard window)'
}

export async function POST() {
  try {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    const { phase, illumination } = calculateMoonPhase(today)
    const saturnFavorable = calculateSaturnInfluence(today)
    const marketBias = calculateMarketBias(phase, saturnFavorable)
    const volatilityForecast = calculateVolatilityForecast(phase)
    const optimalWindow = getOptimalTradingWindow(phase, saturnFavorable)

    const lunarData = {
      date: todayString,
      moon_phase: phase,
      moon_phase_percent: illumination,
      is_saturn_favorable: saturnFavorable,
      market_bias: marketBias,
      volatility_forecast: volatilityForecast,
      optimal_trading_window: optimalWindow
    }

    const { error } = await supabase
      .from('lunar_data')
      .upsert(lunarData)

    if (error) {
      console.error('Error storing lunar data:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lunarData,
      message: 'Lunar data calculated and stored successfully'
    })

  } catch (error) {
    console.error('Error in fetch-lunar-data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
