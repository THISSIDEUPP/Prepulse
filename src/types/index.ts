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
  change_percent?: number
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

export interface SupportResistanceData {
  id: string
  date: string
  symbol: 'SPY' | 'IWM'
  pivot_point: number
  resistance_1: number
  resistance_2: number
  resistance_3: number
  support_1: number
  support_2: number
  support_3: number
  fibonacci_618: number
  fibonacci_382: number
  volume_profile_poc: number
  created_at: string
}

export interface TimingSignals {
  rsi_oversold: boolean
  rsi_overbought: boolean
  macd_bullish_cross: boolean
  macd_bearish_cross: boolean
  near_support: boolean
  near_resistance: boolean
  entry_signal: 'BUY' | 'SELL' | 'HOLD'
  exit_signal?: 'BUY' | 'SELL' | 'HOLD'
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface MultiTimeframeData {
  daily_rsi: number
  daily_macd: number
  current_price: number
  support_resistance: SupportResistanceData
  timing_signals: TimingSignals
}

export interface LunarData {
  id: string
  date: string
  moon_phase: 'NEW_MOON' | 'WAXING_CRESCENT' | 'FIRST_QUARTER' | 'WAXING_GIBBOUS' | 'FULL_MOON' | 'WANING_GIBBOUS' | 'LAST_QUARTER' | 'WANING_CRESCENT'
  moon_phase_percent: number
  is_saturn_favorable: boolean
  market_bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  volatility_forecast: 'HIGH' | 'MEDIUM' | 'LOW'
  optimal_trading_window: string
  created_at: string
}

export interface LunarSignals {
  new_moon_opportunity: boolean
  full_moon_reversal: boolean
  saturn_alignment: boolean
  mercury_retrograde_warning: boolean
  optimal_entry_timing: boolean
}

export interface FVSResult {
  ticker: string
  option_type: 'call' | 'put'
  strike: number
  expiry: string
  spot_price: number
  market_price: number
  fair_value: number
  tag: 'Underpriced' | 'Overpriced' | 'Fairly Priced'
  implied_volatility: number
  time_to_expiration: number
}

export interface FVSFormData {
  ticker: string
  strike: string
  expiry: string
  type: 'call' | 'put'
}
