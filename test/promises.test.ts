import { expect, describe, test } from 'vitest'
import { retry, wait } from '../src'

describe('promises', () => {
  test('retry', async () => {
    let called = 0
    async function testfn () {
      called++
      await wait()
      throw new Error('test error')
    }

    await expect(retry(testfn, { timeouts: [10, 20, 30], delay: 1 })).rejects.toThrow('test error')
    expect(called).toBe(3)
  })

  test('retry + timeout', async () => {
    let called = 0
    async function testfn () {
      called++
      await wait(100)
      throw new Error('test error')
    }

    await expect(retry(testfn, { timeouts: [1, 2, 3], delay: 1 })).rejects.toThrow('operation timed out')

    expect(called).toBe(3)
  })
})
