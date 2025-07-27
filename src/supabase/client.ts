import { createClient } from '@supabase/supabase-js'

declare global {
  var mockServerData: Record<string, string> | undefined
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')

interface MockUser {
  id: string
  email: string
  created_at: string
  role?: 'admin' | 'user'
}

interface MockAuthResponse {
  data: {
    user: MockUser | null
    session: { user: MockUser } | null
  }
  error: { message: string } | null
}

const ADMIN_EMAILS = [
  'cmarbury88@gmail.com', // User's email
  'devin@cognition.ai'    // Devin's email
]

const mockAuth = {
  signUp: async ({ email, password }: { email: string; password: string }): Promise<MockAuthResponse> => {
    if (!email || !password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Email and password are required' }
      }
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
    const mockUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      created_at: new Date().toISOString(),
      role: isAdmin ? 'admin' : 'user'
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
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
        const updatedUser = { ...user, role: user.role || (isAdmin ? 'admin' : 'user') }
        localStorage.setItem('mock-auth-user', JSON.stringify(updatedUser))
        localStorage.setItem('mock-auth-session', JSON.stringify({ user: updatedUser, expires_at: Date.now() + 86400000 }))
        return {
          data: { user: updatedUser, session: { user: updatedUser } },
          error: null
        }
      }
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
    const mockUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      created_at: new Date().toISOString(),
      role: isAdmin ? 'admin' : 'user'
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
    if (typeof window === 'undefined') {
      return {
        data: { 
          user: { 
            id: 'mock-server-user', 
            email: 'server@example.com', 
            created_at: new Date().toISOString(),
            role: 'admin'
          } 
        },
        error: null
      }
    }
    
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

const createMockSupabaseClient = () => {
  if (typeof global !== 'undefined') {
    global.mockServerData = global.mockServerData || {}
  }

  const getStorage = () => {
    if (typeof window !== 'undefined') {
      return localStorage
    } else {
      return {
        getItem: (key: string) => {
          if (typeof global !== 'undefined' && global.mockServerData) {
            return global.mockServerData[key] || null
          }
          return null
        },
        setItem: (key: string, value: string) => {
          if (typeof global !== 'undefined') {
            global.mockServerData = global.mockServerData || {}
            global.mockServerData[key] = value
            
          }
        }
      }
    }
  }
  
  const mockStorage = getStorage()

  const createChainableQuery = (tableName: string, filters: Record<string, unknown> = {}) => {
    const query = {
      eq: (column: string, value: unknown) => {
        filters[column] = value
        return createChainableQuery(tableName, filters)
      },
      in: (column: string, values: unknown[]) => {
        filters[`${column}_in`] = values
        return createChainableQuery(tableName, filters)
      },
      order: () => createChainableQuery(tableName, filters),
      limit: () => createChainableQuery(tableName, filters),
      single: () => {
        const data = mockStorage.getItem(`mock_${tableName}`)
        const records = data ? JSON.parse(data) : []
        
        const filtered = records.filter((record: Record<string, unknown>) => {
          return Object.entries(filters).every(([key, value]) => {
            if (key.endsWith('_in')) {
              const column = key.replace('_in', '')
              return (value as unknown[]).includes(record[column])
            }
            return record[key] === value
          })
        })
        return Promise.resolve({ data: filtered[0] || null, error: null })
      },
      then: (resolve: (value: { data: Record<string, unknown>[], error: null }) => void) => {
        const data = mockStorage.getItem(`mock_${tableName}`)
        const records = data ? JSON.parse(data) : []
        
        const filtered = records.filter((record: Record<string, unknown>) => {
          return Object.entries(filters).every(([key, value]) => {
            if (key.endsWith('_in')) {
              const column = key.replace('_in', '')
              return (value as unknown[]).includes(record[column])
            }
            return record[key] === value
          })
        })
        resolve({ data: filtered, error: null })
      }
    }
    return query
  }

  return {
    auth: mockAuth,
    from: (tableName: string) => ({
      select: () => createChainableQuery(tableName),
      insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
        const existing = mockStorage.getItem(`mock_${tableName}`)
        const records = existing ? JSON.parse(existing) : []
        const newRecord = Array.isArray(data) ? data : [data]
        newRecord.forEach(record => {
          record.id = record.id || `mock-${Date.now()}-${Math.random()}`
          record.created_at = record.created_at || new Date().toISOString()
        })
        records.push(...newRecord)
        mockStorage.setItem(`mock_${tableName}`, JSON.stringify(records))
        return Promise.resolve({ data: newRecord, error: null })
      },
      upsert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
        const existing = mockStorage.getItem(`mock_${tableName}`)
        const records = existing ? JSON.parse(existing) : []
        const newRecord = Array.isArray(data) ? data : [data]
        
        newRecord.forEach(record => {
          record.id = record.id || `mock-${Date.now()}-${Math.random()}`
          record.created_at = record.created_at || new Date().toISOString()
          
          const existingIndex = records.findIndex((r: Record<string, unknown>) => 
            (record.date && record.symbol && r.date === record.date && r.symbol === record.symbol) ||
            (record.date && !record.symbol && r.date === record.date && !r.symbol) ||
            (record.id && r.id === record.id)
          )
          
          if (existingIndex >= 0) {
            records[existingIndex] = { ...records[existingIndex], ...record }
          } else {
            records.push(record)
          }
        })
        
        const updatedData = JSON.stringify(records)
        mockStorage.setItem(`mock_${tableName}`, updatedData)
        
        
        return Promise.resolve({ data: newRecord, error: null })
      }
    })
  }
}

export const supabase = isPlaceholder 
  ? (createMockSupabaseClient() as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
