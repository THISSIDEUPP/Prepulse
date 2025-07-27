import { NextResponse } from 'next/server'
import { supabase } from '@/supabase/client'

function generateShortInterestData(symbol: 'SPY' | 'IWM') {
  const baseData = {
    SPY: {
      short_interest_ratio: 1.2 + Math.random() * 0.6,
      short_interest_percent_float: 8 + Math.random() * 8,
      total_shares_shorted: 95000000 + Math.random() * 40000000
    },
    IWM: {
      short_interest_ratio: 2.1 + Math.random() * 1.4,
      short_interest_percent_float: 25 + Math.random() * 15,
      total_shares_shorted: 80000000 + Math.random() * 30000000
    }
  }

  const data = baseData[symbol]
  const lastReportDate = new Date()
  lastReportDate.setDate(lastReportDate.getDate() - Math.floor(Math.random() * 14))

  return {
    short_interest_ratio: Number(data.short_interest_ratio.toFixed(2)),
    short_interest_percent_float: Number(data.short_interest_percent_float.toFixed(2)),
    total_shares_shorted: Math.floor(data.total_shares_shorted),
    last_report_date: lastReportDate.toISOString().split('T')[0]
  }
}

export async function POST() {
  try {
    const symbols = ['SPY', 'IWM'] as const
    const today = new Date().toISOString().split('T')[0]
    const results = []

    for (const symbol of symbols) {
      const shortData = generateShortInterestData(symbol)
      
      const shortInterestData = {
        date: today,
        symbol,
        ...shortData
      }

      const { error } = await supabase
        .from('short_interest_data')
        .upsert(shortInterestData)

      if (error) {
        results.push({ symbol, success: false, error: error.message })
      } else {
        results.push({ symbol, success: true, data: shortInterestData })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
