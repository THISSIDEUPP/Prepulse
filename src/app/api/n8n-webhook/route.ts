import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { type, payload } = data

    switch (type) {
      case 'market_data_update':
        const { symbol, price, change_percent } = payload
        
        const { error } = await supabase
          .from('market_data_updates')
          .insert({
            symbol,
            price,
            change_percent,
            source: 'n8n_webhook',
            timestamp: new Date().toISOString()
          })

        if (error) {
          throw error
        }
        break

      case 'external_alert':
        console.log('External alert received:', payload)
        break

      default:
        return NextResponse.json({ error: 'Unknown webhook type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
