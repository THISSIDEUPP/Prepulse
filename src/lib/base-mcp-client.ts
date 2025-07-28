export type ETFSymbol = 'SPY' | 'IWM'

export abstract class BaseMCPClient<T> {
  protected connected = false
  protected abstract clientName: string

  async connect(): Promise<boolean> {
    try {
      console.log(`${this.clientName} connected (mock mode)`)
      this.connected = true
      return true
    } catch (error) {
      console.error(`Failed to connect ${this.clientName}:`, error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  protected isConnected(): boolean {
    return this.connected
  }

  protected logConnectionWarning(): void {
    console.warn(`${this.clientName} not connected`)
  }

  protected logDataError(error: unknown): void {
    console.error(`Failed to get data from ${this.clientName}:`, error)
  }

  abstract getData(symbol: ETFSymbol): Promise<T | null>
}
