import { NextResponse } from 'next/server'
import { supabase } from '../../../supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in get-market-data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
