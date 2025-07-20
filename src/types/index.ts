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

export interface MarketData {
  id: string
  date: string
  symbol: 'SPY' | 'IWM'
  open_price: number
  high_price: number
  low_price: number
  close_price: number
  volume: number
  rsi_14?: number
  macd_line?: number
  macd_signal?: number
  macd_histogram?: number
  created_at: string
}

export interface YahooFinanceData {
  symbol: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface User {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

export interface ShortInterestData {
  id: string
  date: string
  symbol: 'SPY' | 'IWM'
  short_interest_ratio: number
  short_interest_percent_float: number
  total_shares_shorted: number
  last_report_date: string
  created_at: string
}

export interface ShortInterestSignals {
  elevated_short_interest: boolean
  cooling_shorts: boolean
  squeeze_watch: boolean
}
