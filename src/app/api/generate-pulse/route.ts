import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/supabase/client'
import { MarketData } from '@/types'

function determineSpyIwmRotation(spyData: MarketData, iwmData: MarketData): 'SPY_LEADING' | 'IWM_LEADING' | 'NEUTRAL' {
  const spyChange = ((spyData.close_price - spyData.open_price) / spyData.open_price) * 100
  const iwmChange = ((iwmData.close_price - iwmData.open_price) / iwmData.open_price) * 100
  
  const difference = Math.abs(spyChange - iwmChange)
  
  if (difference < 0.2) return 'NEUTRAL'
  
  return spyChange > iwmChange ? 'SPY_LEADING' : 'IWM_LEADING'
}

function calculateBreadthScore(spyData: MarketData, iwmData: MarketData): number {
  let score = 50
  
  if (spyData.rsi_14) {
    if (spyData.rsi_14 > 70) score += 15
    else if (spyData.rsi_14 > 50) score += 10
    else if (spyData.rsi_14 < 30) score -= 15
    else if (spyData.rsi_14 < 50) score -= 10
  }
  
  if (iwmData.rsi_14) {
    if (iwmData.rsi_14 > 70) score += 10
    else if (iwmData.rsi_14 > 50) score += 5
    else if (iwmData.rsi_14 < 30) score -= 10
    else if (iwmData.rsi_14 < 50) score -= 5
  }
  
  if (spyData.macd_histogram && spyData.macd_histogram > 0) score += 10
  if (iwmData.macd_histogram && iwmData.macd_histogram > 0) score += 5
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function determineMarketStrength(spyData: MarketData, iwmData: MarketData, breadthScore: number): 'BULLISH' | 'NEUTRAL' | 'BEARISH' {
  const spyChange = ((spyData.close_price - spyData.open_price) / spyData.open_price) * 100
  const iwmChange = ((iwmData.close_price - iwmData.open_price) / iwmData.open_price) * 100
  
  const avgChange = (spyChange + iwmChange) / 2
  
  if (breadthScore > 65 && avgChange > 0.5) return 'BULLISH'
  if (breadthScore < 35 && avgChange < -0.5) return 'BEARISH'
  
  return 'NEUTRAL'
}

function generateSectors(marketStrength: 'BULLISH' | 'NEUTRAL' | 'BEARISH'): { leading: string; lagging: string } {
  const sectors = {
    bullish: {
      leading: ['Technology', 'Consumer Discretionary', 'Communication Services', 'Growth'],
      lagging: ['Utilities', 'Consumer Staples', 'Real Estate', 'Defensive']
    },
    bearish: {
      leading: ['Utilities', 'Consumer Staples', 'Healthcare', 'Defensive'],
      lagging: ['Technology', 'Energy', 'Financials', 'Cyclical']
    },
    neutral: {
      leading: ['Healthcare', 'Industrials', 'Materials'],
      lagging: ['Energy', 'Real Estate', 'Utilities']
    }
  }
  
  const sectorSet = sectors[marketStrength.toLowerCase() as keyof typeof sectors]
  const leading = sectorSet.leading[Math.floor(Math.random() * sectorSet.leading.length)]
  const lagging = sectorSet.lagging[Math.floor(Math.random() * sectorSet.lagging.length)]
  
  return { leading, lagging }
}

function generateSummary(
  spyData: MarketData, 
  iwmData: MarketData, 
  rotation: string, 
  breadthScore: number, 
  marketStrength: string
): string {
  const spyChange = ((spyData.close_price - spyData.open_price) / spyData.open_price) * 100
  const iwmChange = ((iwmData.close_price - iwmData.open_price) / iwmData.open_price) * 100
  
  let summary = `Market Analysis for ${new Date().toLocaleDateString()}:\n\n`
  
  summary += `SPY: ${spyChange > 0 ? '+' : ''}${spyChange.toFixed(2)}% | `
  summary += `IWM: ${iwmChange > 0 ? '+' : ''}${iwmChange.toFixed(2)}%\n`
  
  if (spyData.rsi_14) {
    summary += `SPY RSI(14): ${spyData.rsi_14.toFixed(1)} | `
  }
  if (iwmData.rsi_14) {
    summary += `IWM RSI(14): ${iwmData.rsi_14.toFixed(1)}\n`
  }
  
  summary += `\nRotation: ${rotation.replace('_', ' ')} | Breadth Score: ${breadthScore}/100\n`
  summary += `Market Strength: ${marketStrength}\n\n`
  
  if (marketStrength === 'BULLISH') {
    summary += 'Strong bullish momentum with healthy breadth. Look for breakout opportunities in leading sectors.'
  } else if (marketStrength === 'BEARISH') {
    summary += 'Bearish pressure with weak breadth. Consider defensive positioning and short opportunities.'
  } else {
    summary += 'Mixed signals suggest a consolidation phase. Wait for clearer directional bias before major positions.'
  }
  
  return summary
}

export async function POST(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const body = await request.json()
    const { marketData } = body
    
    let spyData: MarketData
    let iwmData: MarketData
    
    if (!marketData || marketData.length !== 2) {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: dbMarketData, error: fetchError } = await supabase
        .from('market_data')
        .select('*')
        .eq('date', today)
        .in('symbol', ['SPY', 'IWM'])
      
      if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
      }
      
      if (!dbMarketData || dbMarketData.length !== 2) {
        return NextResponse.json({ 
          success: false, 
          error: 'Market data not available for both SPY and IWM. Please fetch market data first.' 
        }, { status: 400 })
      }
      
      spyData = dbMarketData.find(d => d.symbol === 'SPY')!
      iwmData = dbMarketData.find(d => d.symbol === 'IWM')!
    } else {
      spyData = marketData.find((d: MarketData) => d.symbol === 'SPY')!
      iwmData = marketData.find((d: MarketData) => d.symbol === 'IWM')!
    }
    
    const spyIwmRotation = determineSpyIwmRotation(spyData, iwmData)
    const breadthScore = calculateBreadthScore(spyData, iwmData)
    const marketStrength = determineMarketStrength(spyData, iwmData, breadthScore)
    const sectors = generateSectors(marketStrength)
    const summary = generateSummary(spyData, iwmData, spyIwmRotation, breadthScore, marketStrength)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const pulseData = {
      date: today,
      spy_iwm_rotation: spyIwmRotation,
      breadth_score: breadthScore,
      leading_sector: sectors.leading,
      lagging_sector: sectors.lagging,
      market_strength: marketStrength,
      summary: summary,
      created_by: user?.id || 'system'
    }
    
    const { error: insertError } = await supabase
      .from('daily_pulses')
      .upsert(pulseData)
    
    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      pulse: pulseData,
      marketData: { spy: spyData, iwm: iwmData }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
