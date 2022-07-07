import wait from 'waait'
import Bluebird from 'bluebird'

export interface RetryOptions {
  delay?: number;
  timeouts: number[];
}

export function promiseTimeout<T> (ms: number, promise: Promise<T>): Promise<T> {
  return Bluebird.resolve(promise).timeout(ms)
}

export function retry (
  operation: () => Promise<any>,
  options: RetryOptions,
  retriesLeft?: number
) {
  return new Promise((resolve, reject) => {
    const { timeouts } = options

    if (typeof retriesLeft === 'undefined' || retriesLeft === null) {
      retriesLeft = timeouts.length
    }

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
        return wait(options.delay || 300)
          .then(retry.bind(null, operation, options, retriesLeft - 1))
          .then(resolve)
          .catch(reject)
      }
      // Reject (and bubble the result up) if there are no more retries
      return reject(reason)
    })
  })
}

export {
  wait
}
