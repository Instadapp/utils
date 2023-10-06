import { retry } from '../promises'
import { JsonRpcProvider, StaticJsonRpcProvider, JsonRpcBatchProvider } from './json-rpc-provider'

export class JsonRpcRetryProvider extends JsonRpcProvider {
  urls: string[]
  urlIndex: number = 0
  timeouts: number[] = [5_000, 10_000, 15_000]
  delay: number = 300

  constructor (urls: string | string[], options?: { timeouts?: number[], delay?: number }) {
    urls = Array.isArray(urls) ? urls : [urls]

    super(urls[0])

    this.urls = urls
    this.urlIndex = 0

    if (options && options.timeouts) {
      this.timeouts = options.timeouts
    }

    if (options && options.delay) {
      this.delay = options.delay
    }

    Object.setPrototypeOf(this, JsonRpcRetryProvider.prototype)
  }

  public send (method: string, params: Array<any>): Promise<any> {
    const operation = () => super.send(method, params)

    return retry(operation, {
      timeouts: this.timeouts,
      delay: this.delay,
      onRetry: () => {
        this.urlIndex = (this.urlIndex + 1) % this.urls.length
        this.connection.url = this.urls[this.urlIndex]
      }
    })
  }
}

export class JsonRpcRetryBatchProvider extends JsonRpcBatchProvider {
  urls: string[]
  urlIndex: number = 0
  timeouts: number[] = [5_000, 10_000, 15_000]
  delay: number = 300

  constructor (urls: string | string[], options?: { timeouts?: number[], delay?: number }) {
    urls = Array.isArray(urls) ? urls : [urls]

    super(urls[0])

    this.urls = urls
    this.urlIndex = 0

    if (options && options.timeouts) {
      this.timeouts = options.timeouts
    }

    if (options && options.delay) {
      this.delay = options.delay
    }

    Object.setPrototypeOf(this, JsonRpcRetryProvider.prototype)
  }

  public send (method: string, params: Array<any>): Promise<any> {
    const operation = () => super.send(method, params)

    return retry(operation, {
      timeouts: this.timeouts,
      delay: this.delay,
      onRetry: () => {
        this.urlIndex = (this.urlIndex + 1) % this.urls.length
        this.connection.url = this.urls[this.urlIndex]
      }
    })
  }
}

export class StaticJsonRpcRetryProvider extends StaticJsonRpcProvider {
  urls: string[]
  urlIndex: number = 0
  timeouts: number[] = [5_000, 10_000, 15_000]
  delay: number = 300

  constructor (urls: string | string[], options?: { timeouts?: number[], delay?: number }) {
    urls = Array.isArray(urls) ? urls : [urls]

    super(urls[0])

    this.urls = urls
    this.urlIndex = 0

    if (options && options.timeouts) {
      this.timeouts = options.timeouts
    }

    if (options && options.delay) {
      this.delay = options.delay
    }

    Object.setPrototypeOf(this, StaticJsonRpcRetryProvider.prototype)
  }

  public send (method: string, params: Array<any>): Promise<any> {
    const operation = () => super.send(method, params)

    return retry(operation, {
      timeouts: this.timeouts,
      delay: this.delay,
      onRetry: () => {
        this.urlIndex = (this.urlIndex + 1) % this.urls.length
        this.connection.url = this.urls[this.urlIndex]
      }
    })
  }
}
