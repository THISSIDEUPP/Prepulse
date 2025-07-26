import { NextResponse } from 'next/server'
import { supabase } from '@/supabase/client'

interface YahooQuote {
  date: string
  regularMarketOpen: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketPrice: number
  regularMarketVolume: number
}


function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) {
      gains += change
    } else {
      losses -= change
    }
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema = []
  const multiplier = 2 / (period + 1)
  
  ema[0] = prices[0]
  
  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier))
  }
  
  return ema
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | null {
  if (prices.length < 26) return null

  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1]
  
  const macdHistory = []
  for (let i = 25; i < prices.length; i++) {
    macdHistory.push(ema12[i] - ema26[i])
  }
  
  const signalLine = calculateEMA(macdHistory, 9)
  const signal = signalLine[signalLine.length - 1]
  const histogram = macdLine - signal

  return {
    macd: macdLine,
    signal: signal,
    histogram: histogram
  }
}

async function fetchYahooFinanceData(symbol: string, days: number = 30): Promise<YahooQuote[]> {
  try {
    const endDate = Math.floor(Date.now() / 1000)
    const startDate = endDate - (days * 24 * 60 * 60)
    
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Yahoo Finance response for ${symbol}:`, JSON.stringify(data, null, 2))
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No data returned from Yahoo Finance')
    }

    const result = data.chart.result[0]
    const timestamps = result.timestamp || []
    const quote = result.indicators?.quote?.[0]
    
    if (!quote || !timestamps.length) {
      throw new Error('Invalid data structure from Yahoo Finance')
    }

    const historicalData: YahooQuote[] = []
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open?.[i] != null && quote.high?.[i] != null && quote.low?.[i] != null && quote.close?.[i] != null) {
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
        historicalData.push({
          date,
          regularMarketOpen: quote.open[i],
          regularMarketDayHigh: quote.high[i],
          regularMarketDayLow: quote.low[i],
          regularMarketPrice: quote.close[i],
          regularMarketVolume: quote.volume?.[i] || 0
        })
      }
    }

    console.log(`Processed ${historicalData.length} historical records for ${symbol}`)
    return historicalData.reverse() // Most recent first
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return []
  }
}

async function getHistoricalPrices(symbol: string, days: number = 30): Promise<number[]> {
  try {
    const { data } = await supabase
      .from('market_data')
      .select('close_price')
      .eq('symbol', symbol)
      .order('date', { ascending: true })
      .limit(days)

    return data?.map(d => d.close_price) || []
  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error)
    return []
  }
}

export async function POST() {
  try {
    const symbols = ['SPY', 'IWM']
    const results = []

    for (const symbol of symbols) {
      const historicalQuotes = await fetchYahooFinanceData(symbol, 30)
      
      if (historicalQuotes.length === 0) {
        results.push({ symbol, success: false, error: 'Failed to fetch data' })
        continue
      }

      const marketDataBatch = []
      
      for (const quote of historicalQuotes) {
        const existingPrices = await getHistoricalPrices(symbol, 30)
        const allPrices = [...existingPrices, quote.regularMarketPrice]

        const rsi = calculateRSI(allPrices)
        const macd = calculateMACD(allPrices)

        const marketData = {
          date: quote.date,
          symbol,
          open_price: quote.regularMarketOpen,
          high_price: quote.regularMarketDayHigh,
          low_price: quote.regularMarketDayLow,
          close_price: quote.regularMarketPrice,
          volume: quote.regularMarketVolume,
          rsi_14: rsi,
          macd_line: macd?.macd || null,
          macd_signal: macd?.signal || null,
          macd_histogram: macd?.histogram || null
        }

        marketDataBatch.push(marketData)
      }

      const { error } = await supabase
        .from('market_data')
        .upsert(marketDataBatch)

      if (error) {
        results.push({ symbol, success: false, error: error.message })
      } else {
        results.push({ symbol, success: true, data: marketDataBatch })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error in fetch-market-data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
