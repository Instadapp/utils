import { expect, describe, test, vi } from 'vitest'
import NodeCache from 'node-cache'
import { AbiFetcher, ICache } from '../src'
import { polygonMaticABI } from './fixtures'

const defaultAbiCache = new NodeCache()

const defaultAbiFetcher = new AbiFetcher({
  retries: 2,
  cache: {
    get (key) {
      return defaultAbiCache.get(key)
    },
    set (key, value) {
      return defaultAbiCache.set(key, value, 60)
    }
  },
  etherscanApiKey: {
    mainnet: process.env.MAINNET_ETHERSCAN_API_KEY,
    polygon: process.env.POLYGON_ETHERSCAN_API_KEY,
    avalanche: process.env.AVLANCHE_ETHERSCAN_API_KEY,
    arbitrum: process.env.ARBITRUM_ETHERSCAN_API_KEY,
    optimism: process.env.OPTIMISM_ETHERSCAN_API_KEY,
    fantom: process.env.FANTOM_ETHERSCAN_API_KEY
  }
})

describe.concurrent('abi', () => {
  test('can fetch abi', async () => {
    const abi = await defaultAbiFetcher.get('0x0000000000000000000000000000000000001010', 'polygon')

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

    const proxyOnlyAbi = await defaultAbiFetcher.get(usdcAddress, network, 'proxyOnly')
    expect(proxyOnlyAbi.length).toBe(9)

    const implementationOnlyAbi = await defaultAbiFetcher.get(usdcAddress, network, 'implementationOnly')
    expect(implementationOnlyAbi.length).toBe(72)

    const abi = await defaultAbiFetcher.get(usdcAddress, network, 'proxyAndImplementation')
    expect(abi.length).toBe(81)
  })

  test('can fetch proxy implementation - EIP-897', async () => {
    const usdcAddress = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
    const network = 'polygon'

    const proxyOnlyAbi = await defaultAbiFetcher.get(usdcAddress, network, 'proxyOnly')
    expect(proxyOnlyAbi.length).toBeTruthy()

    const implementationOnlyAbi = await defaultAbiFetcher.get(usdcAddress, network, 'implementationOnly')
    expect(implementationOnlyAbi.length).toBeTruthy()
  })

  test('throw exception on bad address', async () => {
    await expect(defaultAbiFetcher.get('asdasd', 'polygon')).rejects.toThrowError()
  })

  test('throw exception on EOA', async () => {
    await expect(defaultAbiFetcher.get('0xA7366d1aE09e6fD6Cb43CFa39A2D5E43f120222c', 'polygon')).rejects.toThrowError()
  })

  test('can fetch compound v2 proxy implementation', async () => {
    const abi = await defaultAbiFetcher.get('0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', 'mainnet', 'implementationOnly')

    expect(abi).to.deep.include({
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'contract CToken',
          name: 'cToken',
          type: 'address'
        }
      ],
      name: 'MarketListed',
      type: 'event'
    })
  })

  test('can fetch abi using blockscout v5 - aurora', async () => {
    const abi = await defaultAbiFetcher.get('0x4988a896b1227218e4A686fdE5EabdcAbd91571f', 'aurora', 'implementationOnly')

    expect(abi.length).to.be.greaterThan(0)
  })

  test('can fetch abi using blockscout v5 - fuse', async () => {
    const abi = await defaultAbiFetcher.get('0xeEeEEb57642040bE42185f49C52F7E9B38f8eeeE', 'fuse', 'implementationOnly')

    expect(abi.length).to.be.greaterThan(0)
  })

  test('support raw implementation address', async () => {
    const abi = await defaultAbiFetcher.get('0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B', 'mainnet', 'implementationOnly')

    expect(abi.length).to.be.greaterThan(0)
  })

  test('support fluid proxy implementation address', async () => {
    const abi = await defaultAbiFetcher.get('0x264786EF916af64a1DB19F513F24a3681734ce92', 'mainnet', 'implementationOnly')
    expect(abi.length).to.be.greaterThan(0)
  })
}, {
  retry: 2
})
