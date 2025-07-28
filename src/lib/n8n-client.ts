export interface N8nWorkflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export class N8nClient {
  private baseUrl: string
  private auth: string | null = null

  constructor() {
    this.baseUrl = process.env.N8N_URL || 'http://localhost:5678'
  }

  private getAuth(): string {
    if (this.auth) {
      return this.auth
    }
    
    const username = process.env.N8N_USER || 'admin'
    const password = process.env.N8N_PASSWORD
    if (!password) {
      throw new Error('N8N_PASSWORD environment variable is required')
    }
    
    this.auth = Buffer.from(`${username}:${password}`).toString('base64')
    return this.auth
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch('/api/n8n-proxy?endpoint=workflows', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`n8n proxy returned ${response.status}: ${response.statusText}`)
        return []
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.warn('Failed to connect to n8n server:', error)
      return []
    }
  }

  async activateWorkflow(workflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/n8n-proxy?endpoint=workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.warn('Failed to activate workflow:', error)
      return false
    }
  }

  async deactivateWorkflow(workflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/n8n-proxy?endpoint=workflows/${workflowId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.warn('Failed to deactivate workflow:', error)
      return false
    }
  }
}

export const n8nClient = new N8nClient()
