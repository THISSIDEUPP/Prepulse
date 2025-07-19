export interface DailyPulse {
  id: string
  date: string
  spy_iwm_rotation: 'SPY_LEADING' | 'IWM_LEADING' | 'NEUTRAL'
  breadth_score: number // 0-100
  leading_sector: string
  lagging_sector: string
  market_strength: 'BULLISH' | 'NEUTRAL' | 'BEARISH'
  summary: string
  created_at: string
  created_by: string
}

export interface User {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}
