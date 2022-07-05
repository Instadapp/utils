import { JsonRpcProvider } from '@ethersproject/providers'
import wait from 'waait'
import Bluebird from 'bluebird'

export interface RetryOptions {
    delay?: number;
    timeouts: number[];
}

export function promiseTimeout<T> (ms: number, promise: Promise<T>): Promise<T> {
  return Bluebird.resolve(promise).timeout(ms)
}

export function retryOperation (
  retriesLeft: number,
  operation: () => Promise<any>,
  options: RetryOptions
) {
  return new Promise((resolve, reject) => {
    const { timeouts } = options
    // Find the timeout for this specific iteration
    const timeout = timeouts[timeouts.length - retriesLeft]

    // Wrap the original operation in a timeout
    const execution = promiseTimeout(timeout, operation())

    // If the promise is successful, resolve it and bubble the result up
    return execution.then(resolve).catch((reason: any) => {
      // If there are any retries left, we call the same retryOperation function again,
      // but decrementing the number of retries left by 1
      if (retriesLeft - 1 > 0) {
        // Delay the new attempt slightly
        return wait(options.delay || 50)
          .then(retryOperation.bind(null, retriesLeft - 1, operation, options))
          .then(resolve)
          .catch(reject)
      }
      // Reject (and bubble the result up) if there are no more retries
      return reject(reason)
    })
  })
}

export class JsonRpcRetryProvider extends JsonRpcProvider {
  public perform (method: string, params: any): Promise<any> {
    const timeouts = [5_000, 10_000]
    const operation = () => super.perform(method, params)

    return retryOperation(2, operation, { timeouts, delay: 50 })
  }
}
