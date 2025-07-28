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
    const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      headers: {
        'Authorization': `Basic ${this.getAuth()}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async activateWorkflow(workflowId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.getAuth()}`,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  }

  async deactivateWorkflow(workflowId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.getAuth()}`,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  }
}

export const n8nClient = new N8nClient()
