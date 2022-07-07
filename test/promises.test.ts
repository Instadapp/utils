import { expect, describe, test } from 'vitest'
import { retry, wait } from '../src'

describe('promises', () => {
  test('retry', async () => {
    let called = 0
    async function testfn () {
      called++
      await wait(2)
      throw new Error('test error')
    }

    await expect(retry(testfn, { timeouts: [1, 2, 3], delay: 1 })).rejects.toThrow('test error')
    expect(called).toBe(3)
  })

  test('retry', async () => {
    let called = 0
    async function testfn () {
      called++
      await wait(10)
      throw new Error('test error')
    }

    await expect(retry(testfn, { timeouts: [1, 2, 3], delay: 1 })).rejects.toThrow('operation timed out')
    expect(called).toBe(3)
  })
})
