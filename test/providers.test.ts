import { JsonRpcProvider } from '@ethersproject/providers'
import { expect, describe, test } from 'vitest'
import { JsonRpcRetryProvider, toJsonRpcProvider } from '../src'

describe.concurrent('providers', () => {
  test('string', async () => {
    const provider = toJsonRpcProvider('https://rpc.ankr.com/eth')
    expect(await provider.getBlockNumber()).toBeDefined()
    expect(typeof await provider.getBlockNumber()).toBe('number')
  })

  test('JsonRpcProvider', async () => {
    const provider = toJsonRpcProvider(
      new JsonRpcProvider('https://rpc.ankr.com/eth')
    )
    expect(await provider.getBlockNumber()).toBeDefined()
    expect(typeof await provider.getBlockNumber()).toBe('number')
  })

  test('ExternalProvider@request', async () => {
    const provider = toJsonRpcProvider(
      {
        async request (_payload: any) {
          return await Promise.resolve(69420)
        }
      }
    )
    expect(await provider.getBlockNumber()).toBeDefined()
    expect(typeof await provider.getBlockNumber()).toBe('number')
  })

  test('ExternalProvider@send', async () => {
    const provider = toJsonRpcProvider(
      {
        send (payload: any, cb: Function) {
          if (payload.method === 'eth_chainId') {
            return cb(undefined, {
              jsonrpc: '2.0',
              id: 1,
              result: '0x1'
            })
          }
          cb(undefined, {
            jsonrpc: '2.0',
            id: 1,
            result: 69420
          })
        }
      }
    )
    expect(await provider.getBlockNumber()).toBeDefined()
    expect(typeof await provider.getBlockNumber()).toBe('number')
  })

  test('JsonRpcRetryProvider - multi urls', async () => {
    const provider = new JsonRpcRetryProvider([
      'https://rpc.ankr.com/invalid',
      'https://rpc.ankr.com/invalid-2',
      'https://rpc.ankr.com/eth',
      'https://eth.llamarpc.com'
    ])

    expect(await provider.getBlockNumber()).toBeDefined()
    expect(typeof await provider.getBlockNumber()).toBe('number')
  })
})
