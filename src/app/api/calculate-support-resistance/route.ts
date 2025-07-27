import { NextResponse } from 'next/server'
import { supabase } from '@/supabase/client'

interface HistoricalOHLCV {
  date: string
  open_price: number
  high_price: number
  low_price: number
  close_price: number
  volume: number
}

function calculatePivotPoints(high: number, low: number, close: number) {
  const pivot = (high + low + close) / 3
  
  return {
    pivot_point: pivot,
    resistance_1: (2 * pivot) - low,
    resistance_2: pivot + (high - low),
    resistance_3: high + 2 * (pivot - low),
    support_1: (2 * pivot) - high,
    support_2: pivot - (high - low),
    support_3: low - 2 * (high - pivot)
  }
}

function calculateFibonacci(historicalData: HistoricalOHLCV[]) {
  if (historicalData.length < 10) return { fibonacci_618: 0, fibonacci_382: 0 }
  
  const prices = historicalData.map(d => d.close_price)
  const high = Math.max(...prices)
  const low = Math.min(...prices)
  const range = high - low
  
  return {
    fibonacci_618: high - (range * 0.618),
    fibonacci_382: high - (range * 0.382)
  }
}

function calculateVolumeProfilePOC(historicalData: HistoricalOHLCV[]) {
  if (historicalData.length === 0) return 0
  
  const volumeByPrice = new Map<number, number>()
  
  historicalData.forEach(data => {
    const price = Math.round(data.close_price * 100) / 100
    const volume = data.volume
    volumeByPrice.set(price, (volumeByPrice.get(price) || 0) + volume)
  })
  
  let maxVolume = 0
  let pocPrice = 0
  
  volumeByPrice.forEach((volume, price) => {
    if (volume > maxVolume) {
      maxVolume = volume
      pocPrice = price
    }
  })
  
  return pocPrice
}

async function getHistoricalOHLCV(symbol: string, days: number = 20): Promise<HistoricalOHLCV[]> {
  try {
    const { data } = await supabase
      .from('market_data')
      .select('date, open_price, high_price, low_price, close_price, volume')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(days)

    return data || []
  } catch {
    return []
  }
}

export async function POST() {
  try {
    const symbols = ['SPY', 'IWM'] as const
    const today = new Date().toISOString().split('T')[0]
    const results = []

    for (const symbol of symbols) {
      const historicalData = await getHistoricalOHLCV(symbol, 20)
      
      if (historicalData.length === 0) {
        results.push({ symbol, success: false, error: 'No historical data available' })
        continue
      }

      const latestData = historicalData[0]
      const { high_price, low_price, close_price } = latestData

      const pivotPoints = calculatePivotPoints(high_price, low_price, close_price)
      const fibonacci = calculateFibonacci(historicalData)
      const volumeProfilePOC = calculateVolumeProfilePOC(historicalData)

      const supportResistanceData = {
        date: today,
        symbol,
        ...pivotPoints,
        ...fibonacci,
        volume_profile_poc: volumeProfilePOC
      }

      const { error } = await supabase
        .from('support_resistance_data')
        .upsert(supportResistanceData)

      if (error) {
        results.push({ symbol, success: false, error: error.message })
      } else {
        results.push({ symbol, success: true, data: supportResistanceData })
      }
    }

    return NextResponse.json({ 
      success: results.some(r => r.success), 
      results,
      message: results.every(r => !r.success) ? 'No data available for calculations' : 'Calculations completed'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
