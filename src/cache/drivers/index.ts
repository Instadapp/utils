const cache = new Map()

export const memoryCacheDriver = {
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
  }
}
