import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/supabase/client'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const pulseData = await request.json()

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email')

    if (usersError) {
      throw new Error('Failed to fetch users')
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 })
    }

    const emailContent = generateEmailContent(pulseData)

    const emailPromises = users.map(user => 
      resend.emails.send({
        from: 'PrePulse <noreply@prepulse.dev>',
        to: user.email,
        subject: `📈 PrePulse Alert: ${pulseData.market_strength} Market - ${new Date(pulseData.date).toLocaleDateString()}`,
        html: emailContent,
      })
    )

    await Promise.all(emailPromises)

    return NextResponse.json({ success: true, message: `Email sent to ${users.length} users` })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

interface PulseData {
  date: string
  market_strength: string
  spy_iwm_rotation: string
  breadth_score: number
  leading_sector: string
  lagging_sector: string
  summary: string
}

function generateEmailContent(pulse: PulseData) {
  const strengthColor = pulse.market_strength === 'BULLISH' ? '#10B981' : 
                       pulse.market_strength === 'BEARISH' ? '#EF4444' : '#F59E0B'
  
  const strengthIcon = pulse.market_strength === 'BULLISH' ? '📈' : 
                      pulse.market_strength === 'BEARISH' ? '📉' : '➡️'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PrePulse Market Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📊 PrePulse</h1>
        <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Daily Market Pulse Alert</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1a202c; margin: 0 0 10px 0;">${new Date(pulse.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h2>
          <div style="background: ${strengthColor}; color: white; padding: 15px; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold;">
            ${strengthIcon} Market Strength: ${pulse.market_strength}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">SPY/IWM Rotation</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #3182ce;">
              ${pulse.spy_iwm_rotation.replace('_', ' ')}
            </p>
          </div>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">Breadth Score</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2d3748;">${pulse.breadth_score}</p>
            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; margin-top: 10px;">
              <div style="background: #3182ce; height: 8px; border-radius: 4px; width: ${pulse.breadth_score}%;"></div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f0fff4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">Leading Sector</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">${pulse.leading_sector}</p>
          </div>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">Lagging Sector</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">${pulse.lagging_sector}</p>
          </div>
        </div>

        <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">Market Summary</h3>
          <p style="margin: 0; color: #4a5568; line-height: 1.7;">${pulse.summary}</p>
        </div>

        <div style="text-align: center; padding: 20px; background: #edf2f7; border-radius: 8px;">
          <p style="margin: 0; color: #718096; font-size: 14px;">
            This alert was sent at ${new Date().toLocaleTimeString()} EST<br>
            <strong>PrePulse</strong> - Built by traders, for traders
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
