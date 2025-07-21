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
    if (typeof window === 'undefined') {
      return {
        data: { 
          user: { 
            id: 'mock-server-user', 
            email: 'server@example.com', 
            created_at: new Date().toISOString() 
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
  const serverStorage: Record<string, string> = {}
  
  const mockStorage = {
    getItem: (key: string) => {
      if (typeof window === 'undefined') {
        return serverStorage[key] || null
      }
      return localStorage.getItem(key)
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') {
        serverStorage[key] = value
        if (typeof global !== 'undefined') {
          global.mockServerData = global.mockServerData || {}
          global.mockServerData[key] = value
        }
        return
      }
      localStorage.setItem(key, value)
    }
  }

  const syncServerDataToClient = (tableName: string) => {
    if (typeof window !== 'undefined' && typeof global !== 'undefined' && global.mockServerData) {
      const serverData = global.mockServerData[`mock_${tableName}`]
      if (serverData) {
        const clientData = localStorage.getItem(`mock_${tableName}`)
        const clientRecords = clientData ? JSON.parse(clientData) : []
        const serverRecords = JSON.parse(serverData)
        
        const mergedRecords = [...clientRecords, ...serverRecords.filter((item: Record<string, unknown>) => 
          !clientRecords.some((clientItem: Record<string, unknown>) => 
            (item.date && item.symbol && clientItem.date === item.date && clientItem.symbol === item.symbol) ||
            (item.date && !item.symbol && clientItem.date === item.date && !clientItem.symbol) ||
            (item.id && clientItem.id === item.id)
          )
        )]
        
        localStorage.setItem(`mock_${tableName}`, JSON.stringify(mergedRecords))
        return mergedRecords
      }
    }
    return null
  }

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
        syncServerDataToClient(tableName)
        
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
        syncServerDataToClient(tableName)
        
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
        
        mockStorage.setItem(`mock_${tableName}`, JSON.stringify(records))
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
