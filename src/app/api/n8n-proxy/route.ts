import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE_URL = process.env.N8N_URL || 'http://localhost:5678'
const N8N_API_KEY = process.env.N8N_API_KEY

function getAuthHeaders() {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable is required')
  }
  
  return {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'workflows'
    
    const response = await fetch(`${N8N_BASE_URL}/api/v1/${endpoint}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `n8n API returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('n8n proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to n8n server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint parameter required' }, { status: 400 })
    }

    const response = await fetch(`${N8N_BASE_URL}/api/v1/${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `n8n API returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('n8n proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to n8n server' },
      { status: 500 }
    )
  }
}
