import { ICacheDriver, ICacheLock } from '..'

const cache = new Map()

export const memoryCacheDriver: ICacheDriver = {
  async get (key: string) {
    const value = cache.get(key)
    const expireOn = cache.get(`${key}:expireOn`)

    if (expireOn && expireOn instanceof Date && expireOn.getTime() < new Date().getTime()) {
      return null
    }

    return await Promise.resolve(value)
  },
  async set (key: string, value: any, seconds?: number) {
    cache.set(key, value)

    if (seconds) {
      cache.set(`${key}:expireOn`, new Date(Date.now() + seconds * 1000))
    }

    await Promise.resolve()
  },
  async forget (key: string) {
    cache.delete(key)
    cache.delete(`${key}:expireOn`)

    await Promise.resolve()
  },
  async flush () {
    cache.clear()

    await Promise.resolve()
  },
  lock (key, seconds) {
    return new MemoryLock(key, seconds)
  }
}

const cacheLock = new Map()

class MemoryLock implements ICacheLock {
  // eslint-disable-next-line no-useless-constructor
  constructor (private key: string, private seconds: number) { }

  acquire () {
    const currentTime = Date.now()
    const expiryTime = currentTime + this.seconds * 1000

    const existingLock = cacheLock.get(this.key)

    if (existingLock && existingLock > currentTime) {
      return false
    }

    cacheLock.set(this.key, expiryTime)

    return true
  }

  release () {
    const lockExpiry = cacheLock.get(this.key)

    if (lockExpiry && lockExpiry > Date.now()) {
      cacheLock.delete(this.key)
    }
  }
}
