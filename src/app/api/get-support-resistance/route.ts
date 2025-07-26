import { NextResponse } from 'next/server'
import { supabase } from '../../../supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const date = searchParams.get('date')

    if (!symbol || !date) {
      return NextResponse.json(
        { success: false, error: 'Symbol and date are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('support_resistance_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('date', date)
      .single()

    if (error && error.message !== 'No rows found') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || null
    })
  } catch (error) {
    console.error('Error in get-support-resistance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
