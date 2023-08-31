import { JsonRpcProvider, StaticJsonRpcProvider, JsonRpcBatchProvider } from '@ethersproject/providers'
import { retry } from '../promises'

export class JsonRpcRetryProvider extends JsonRpcProvider {
  timeouts: number[] = [5_000, 10_000, 15_000]
  delay: number = 300

  constructor (url: string, options?: { timeouts?: number[], delay?: number }) {
    super(url)

    if (options && options.timeouts) {
      this.timeouts = options.timeouts
    }

    if (options && options.delay) {
      this.delay = options.delay
    }

    Object.setPrototypeOf(this, JsonRpcRetryProvider.prototype)
  }

  public perform (method: string, params: any): Promise<any> {
    const operation = () => super.perform(method, params)

    return retry(operation, { timeouts: this.timeouts, delay: this.delay })
  }
}

export class JsonRpcRetryBatchProvider extends JsonRpcBatchProvider {
  timeouts: number[] = [5_000, 10_000, 15_000]
  delay: number = 300

  constructor (url: string, options?: { timeouts?: number[], delay?: number }) {
    super(url)

    if (options && options.timeouts) {
      this.timeouts = options.timeouts
    }

    if (options && options.delay) {
      this.delay = options.delay
    }

    Object.setPrototypeOf(this, JsonRpcRetryProvider.prototype)
  }

  public perform (method: string, params: any): Promise<any> {
    const operation = () => super.perform(method, params)

    return retry(operation, { timeouts: this.timeouts, delay: this.delay })
  }
}

export class StaticJsonRpcRetryProvider extends StaticJsonRpcProvider {
  timeouts: number[] = [5_000, 10_000, 15_000]
  delay: number = 300

  constructor (url: string, options?: { timeouts?: number[], delay?: number }) {
    super(url)

    if (options && options.timeouts) {
      this.timeouts = options.timeouts
    }

    if (options && options.delay) {
      this.delay = options.delay
    }

    Object.setPrototypeOf(this, StaticJsonRpcRetryProvider.prototype)
  }

  public perform (method: string, params: any): Promise<any> {
    const operation = () => super.perform(method, params)

    return retry(operation, { timeouts: this.timeouts, delay: this.delay })
  }
}
