import { expect, describe, test, vi } from 'vitest'
import { Cache, wait } from '../src'

describe('cache', () => {
  test('custom driver', async () => {
    const cacheSet = vi.fn()
    const cacheFlush = vi.fn()
    const cacheForget = vi.fn()

    Cache.extend('testing-1', {
      get (_key) {
        return Promise.resolve(123 as any)
      },
      async set (_key, _value, _seconds) {
        await cacheSet(...arguments)
      },
      async forget (_key) {
        await cacheForget(...arguments)
      },
      async flush () {
        await cacheFlush(...arguments)
      }
    })

    Cache.setDefault('testing-1')

    await Cache.put('a', 69, 420)

    expect(await Cache.get('a')).toBe(123)

    await Cache.forget('z')
    await Cache.flush()

    expect(cacheSet).toBeCalledWith('a', 69, 420)
    expect(cacheForget).toBeCalledWith('z')
    expect(cacheFlush).toBeCalled()
  })

  test('memory', async () => {
    Cache.setDefault('memory')

    await Cache.put('a', 123)

    expect(await Cache.get('a')).toBe(123)

    await Cache.put('b', 42, 1)

    expect(await Cache.get('b')).toBe(42)

    await wait(1100)

    expect(await Cache.get('b')).toBe(null)
  })

  test('remember', async () => {
    Cache.setDefault('memory')

    const rememberValueFn = vi.fn(() => 123)

    await Cache.remember('remember', 1, rememberValueFn)
    await Cache.remember('remember', 1, rememberValueFn)
    await Cache.remember('remember', 1, rememberValueFn)

    expect(rememberValueFn).toBeCalledTimes(1)
    expect(rememberValueFn).toReturnWith(123)
  })

  test('store', async () => {
    const rememberValueFn = vi.fn()

    Cache.extend('store', {
      async get (_key: string) {
        await rememberValueFn()
      },
      async set (_key, _value, _seconds) {
      },
      async forget (_key) {
      },
      async flush () {
      }
    })

    Cache.setDefault('memory')

    await Cache.store('store').remember('remember', 1, 123)
    await Cache.store('store').remember('remember', 1, 123)
    await Cache.store('store').remember('remember', 1, 123)

    expect(Cache.defaultDriver).toBe('memory')
    expect(rememberValueFn).toBeCalledTimes(3)

    await Cache.set('test', 69)

    expect(await Cache.get('test')).toBe(69)
  })

  test('atomic lock', async () => {
    const lock = Cache.lock('lock', 10)

    if (await lock.get()) {
      await wait(1000)

      await lock.release()
    }
  })

  test('atomic lock - cb', async () => {
    const acquired = await Cache.lock('lock-cb', 10).get(async () => {
      await wait(1000)
    })

    expect(acquired).toBe(true)
  })

  test('atomic lock - multiple', async () => {
    const [acquired, notAcquired] = await Promise.all([
      Cache.lock('lock-multiple', 10).get(async () => {
        await wait(1000)
      }),
      Cache.lock('lock-multiple', 10).get(async () => {
        await wait(1000)
      })
    ])

    expect(acquired).toBe(true)
    expect(notAcquired).toBe(false)
  })

  test('atomic lock - getLock', async () => {
    const acquired = await Cache.getLock('get-lock', 10, async () => {
      await wait(1000)
    })

    expect(acquired).toBe(true)
  })
})
