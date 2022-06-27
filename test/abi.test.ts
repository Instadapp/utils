import { expect, describe, test, vi } from 'vitest'
import NodeCache from 'node-cache'
import { AbiFetcher, ICache } from '../src'
import { mainnetUsdcImplementationAbi, mainnetUsdcProxyAbi, polygonMaticABI } from './fixtures'

describe('abi', () => {
  test('can fetch abi', async () => {
    const abiFetcher = new AbiFetcher()
    const abi = await abiFetcher.get('0x0000000000000000000000000000000000001010', 'polygon')

    expect(abi).toEqual(polygonMaticABI)
  })

  test('can define a custom cache', async () => {
    const abiCache = new NodeCache()

    const cache: ICache = {
      get (key) {
        return abiCache.get(key)
      },
      set (key, value) {
        return abiCache.set(key, value, 10)
      }
    }

    const cacheGet = vi.spyOn(cache, 'get')
    const cacheSet = vi.spyOn(cache, 'set')

    const abiFetcher = new AbiFetcher({
      cache
    })
    expect(await abiFetcher.get('0x0000000000000000000000000000000000001010', 'polygon')).toEqual(polygonMaticABI)
    expect(await abiFetcher.get('0x0000000000000000000000000000000000001010', 'polygon')).toEqual(polygonMaticABI)

    expect(cacheGet).toBeCalledTimes(2)
    expect(cacheSet).toBeCalledTimes(1)
  })

  test('can set etherscan keys', async () => {
    const etherscanApiKey = {
      mainnet: '9D13ZE7XSBTJ94N9BNJ2MA33VMAY2YPIRB'
    }

    const etherscan = vi.spyOn(etherscanApiKey, 'mainnet', 'get')

    const abiFetcher = new AbiFetcher({
      etherscanApiKey
    })

    await abiFetcher.get('0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 'mainnet')

    expect(etherscan).toBeCalledTimes(1)
  })

  test('can fetch proxy implementation - EIP-1967', async () => {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    const network = 'mainnet'

    const abiFetcher = new AbiFetcher()

    const proxyOnlyAbi = await abiFetcher.get(usdcAddress, network, 'proxyOnly')
    expect(proxyOnlyAbi).toEqual(mainnetUsdcProxyAbi)

    const implementationOnlyAbi = await abiFetcher.get(usdcAddress, network, 'implementationOnly')
    expect(implementationOnlyAbi).toEqual(mainnetUsdcImplementationAbi)

    const abi = await abiFetcher.get(usdcAddress, network, 'proxyAndImplementation')
    expect(abi).toEqual([...mainnetUsdcProxyAbi, ...mainnetUsdcImplementationAbi])
  })

  test('can fetch proxy implementation - EIP-897', async () => {
    const usdcAddress = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
    const network = 'polygon'

    const abiFetcher = new AbiFetcher()

    const proxyOnlyAbi = await abiFetcher.get(usdcAddress, network, 'proxyOnly')
    expect(proxyOnlyAbi.length).toBeTruthy()

    const implementationOnlyAbi = await abiFetcher.get(usdcAddress, network, 'implementationOnly')
    expect(implementationOnlyAbi.length).toBeTruthy()
  })
})
