import { memoryCacheDriver } from './drivers'

export interface ICacheLock {
  acquire: () => Promise<boolean> | boolean
  release: () => Promise<void> | void
}

export interface ICacheDriver {
  get(key: string): Promise<any>
  set(key: string, value: any, seconds?: number): Promise<void>
  forget(key: string): Promise<void>
  flush(): Promise<void>
  lock?: (key: string, seconds: number, owner: string) => ICacheLock
}

export class Cache {
  static defaultDriver: string = 'memory'
  static registeredDrivers: Record<string, ICacheDriver> = {
    memory: memoryCacheDriver
  }

  static setDefault (name: string) {
    this.defaultDriver = name
  }

  static extend (name: string, cacheDriver: ICacheDriver) {
    this.registeredDrivers[name] = cacheDriver
  }

  static store (name: string) {
    return new Proxy(Cache, {
      get (target, p, receiver) {
        if (p === 'driver') {
          return target.registeredDrivers[name]
        }

        return Reflect.get(target, p, receiver)
      }
    })
  }

  static get driver () {
    const driver = this.registeredDrivers[this.defaultDriver]

    if (!driver) {
      throw new Error(`Driver ${this.defaultDriver} is not found`)
    }

    return driver
  }

  static async get<T extends any> (key: string, defaultValue: T | (() => Promise<T> | T) = null) {
    const value = await this.driver.get(key).catch(() => null)

    const defaultFn = defaultValue instanceof Function ? defaultValue : () => defaultValue

    if (value) {
      return value
    }

    return await defaultFn()
  }

  static async put<T extends any> (key: string, value: T | (() => Promise<T> | T), seconds?: number) {
    const valueFn = value instanceof Function ? value : () => value

    await this.driver.set(key, await valueFn(), seconds)
  }

  static async set<T extends any> (key: string, value: T | (() => Promise<T> | T), seconds?: number) {
    await this.put(key, value, seconds)
  }

  static async forget (key: string) {
    await this.driver.forget(key).catch(() => { })
  }

  static async flush () {
    await this.driver.flush().catch(() => { })
  }

  static async pull<T extends any> (key: string, defaultValue: T | (() => Promise<T> | T) = null) {
    const value = await this.get(key, defaultValue)

    await this.forget(key)

    return value
  }

  static async remember<T extends any> (key: string, seconds: number, defaultValue: T | (() => Promise<T> | T) = null) {
    let value = await this.get(key)
    const valueFn = defaultValue instanceof Function ? defaultValue : () => defaultValue

    if (!value) {
      value = await valueFn()

      await this.put(key, value, seconds)
    }

    return value
  }

  static lock (key: string, options: { seconds?: number, owner?: string, sleepMilliseconds?: number } = {}) {
    if (!this.driver.lock) {
      throw new Error(`Driver ${this.defaultDriver} does not support locking`)
    }

    const lock = this.driver.lock(key, options.seconds ?? 86400, options.owner ?? Date.now().toString())

    return {
      release: lock.release.bind(lock),
      get: async (cb?: () => Promise<void> | void): Promise<boolean> => {
        if (!cb) {
          return await lock.acquire()
        }

        if (await lock.acquire()) {
          await cb()

          await lock.release()

          return true
        }

        return false
      },
      block: async (timeout: number, cb?: () => Promise<void> | void): Promise<void> => {
        const starting = Date.now()

        while (!await lock.acquire()) {
          await new Promise(resolve => setTimeout(resolve, options.sleepMilliseconds ?? 300))

          if (Date.now() - timeout * 1000 >= starting) {
            throw new Error(`Lock ${key} is not acquired within ${timeout} seconds`)
          }
        }

        if (cb) {
          try {
            await cb()
          } finally {
            await lock.release()
          }
        }
      }
    }
  }

  static async getLock (key: string, cb: () => Promise<void> | void, options: { seconds?: number, owner?: string, sleepMilliseconds?: number } = {}) {
    return await this.lock(key, options).get(cb)
  }

  static async block (key: string, timeout: number, cb: () => Promise<void> | void, options: { seconds?: number, owner?: string, sleepMilliseconds?: number } = {}) {
    return await this.lock(key, options).block(timeout, cb)
  }
}
