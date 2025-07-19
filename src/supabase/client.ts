import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')

interface MockUser {
  id: string
  email: string
  created_at: string
}

interface MockAuthResponse {
  data: {
    user: MockUser | null
    session: { user: MockUser } | null
  }
  error: { message: string } | null
}

const mockAuth = {
  signUp: async ({ email, password }: { email: string; password: string }): Promise<MockAuthResponse> => {
    if (!email || !password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Email and password are required' }
      }
    }

    const mockUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    }

    localStorage.setItem('mock-auth-user', JSON.stringify(mockUser))
    localStorage.setItem('mock-auth-session', JSON.stringify({ user: mockUser, expires_at: Date.now() + 86400000 }))

    return {
      data: { user: mockUser, session: { user: mockUser } },
      error: null
    }
  },

  signInWithPassword: async ({ email, password }: { email: string; password: string }): Promise<MockAuthResponse> => {
    if (!email || !password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Email and password are required' }
      }
    }

    const storedUser = localStorage.getItem('mock-auth-user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      if (user.email === email) {
        localStorage.setItem('mock-auth-session', JSON.stringify({ user, expires_at: Date.now() + 86400000 }))
        return {
          data: { user, session: { user } },
          error: null
        }
      }
    }

    const mockUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    }

    localStorage.setItem('mock-auth-user', JSON.stringify(mockUser))
    localStorage.setItem('mock-auth-session', JSON.stringify({ user: mockUser, expires_at: Date.now() + 86400000 }))

    return {
      data: { user: mockUser, session: { user: mockUser } },
      error: null
    }
  },

  signOut: async () => {
    localStorage.removeItem('mock-auth-user')
    localStorage.removeItem('mock-auth-session')
    return { error: null }
  },

  getUser: async () => {
    const session = localStorage.getItem('mock-auth-session')
    if (session) {
      const parsedSession = JSON.parse(session)
      if (parsedSession.expires_at > Date.now()) {
        return {
          data: { user: parsedSession.user },
          error: null
        }
      }
    }
    return {
      data: { user: null },
      error: null
    }
  }
}

const createMockSupabaseClient = () => ({
  auth: mockAuth,
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null })
  })
})

export const supabase = isPlaceholder 
  ? (createMockSupabaseClient() as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
