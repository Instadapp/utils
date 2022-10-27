export interface RetryOptions {
  delay?: number;
  timeouts: number[];
}

export async function promiseTimeout<T> (promise: Promise<T>, ms: number) {
  let timer: any

  try {
    return await Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error('operation timed out'))
        }, ms)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

export function retry<T = any> (
  operation: () => Promise<T>,
  options: RetryOptions,
  retriesLeft?: number
) {
  return new Promise<T>((resolve, reject) => {
    const { timeouts } = options

    if (typeof retriesLeft === 'undefined' || retriesLeft === null) {
      retriesLeft = timeouts.length
    }

    // Find the timeout for this specific iteration
    const timeout = timeouts[timeouts.length - retriesLeft]

    // Wrap the original operation in a timeout
    const execution = promiseTimeout(operation(), timeout)

    // If the promise is successful, resolve it and bubble the result up
    return execution.then(resolve).catch((reason: any) => {
      // If there are any retries left, we call the same retryOperation function again,
      // but decrementing the number of retries left by 1
      if (retriesLeft - 1 > 0) {
        // Delay the new attempt slightly
        return wait(options.delay || 300)
          .then(retry.bind(null, operation, options, retriesLeft - 1))
          .then((value: any) => resolve(value))
          .catch(reject)
      }
      // Reject (and bubble the result up) if there are no more retries
      return reject(reason)
    })
  })
}

export function wait (amount: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, amount))
}
