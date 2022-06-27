import { getAddress } from '@ethersproject/address'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import retry from 'async-retry'
import axios from 'axios'
import type { JsonFragment } from '@ethersproject/abi'
import { IAbiFetcherOptions, Network, ProxyFetchMode } from '../types'

const DEFAULTS: IAbiFetcherOptions = {
  retries: 3,
  implementationStorageLocations: [
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3'
  ],
  proxyFetchMode: 'proxyAndImplementation',
  rpcProviderUrl: {
    polygon: 'https://rpc.ankr.com/polygon',
    mainnet: 'https://rpc.ankr.com/eth',
    avalanche: 'https://rpc.ankr.com/avalanche',
    optimism: 'https://rpc.ankr.com/optimism',
    arbitrum: 'https://rpc.ankr.com/arbitrum',
    fantom: 'https://rpc.ankr.com/fantom'
  },
  networkToEtherscanAPI: {
    polygon: 'https://api.polygonscan.com/api',
    mainnet: 'https://api.etherscan.io/api',
    avalanche: 'https://api.snowtrace.io/api',
    optimism: 'https://api-optimistic.etherscan.io/api',
    arbitrum: 'https://api.arbiscan.io/api',
    fantom: 'https://api.ftmscan.com/api'
  }
}

export class AbiFetcher {
  options: IAbiFetcherOptions

  constructor (options?: Partial<IAbiFetcherOptions>) {
    this.options = Object.assign({}, DEFAULTS, options)
  }

  private async _get (contractAddress: string, network: Network): Promise<JsonFragment[]> {
    const { cache, retries, networkToEtherscanAPI, etherscanApiKey } = this.options

    try {
      getAddress(contractAddress)
    } catch (error) {
      throw new Error('Invalid contract address')
    }

    const cacheKey = `${network}:${contractAddress}`

    if (cache) {
      const abi = await cache.get(cacheKey)

      if (abi) {
        return abi
      }
    }

    try {
      const abi = await retry(
        async () =>
          await axios
            .get(
              networkToEtherscanAPI[network], {
                params: {
                  module: 'contract',
                  action: 'getabi',
                  address: contractAddress,
                  apikey: etherscanApiKey ? etherscanApiKey[network] : undefined
                }
              }
            )
            .then(({ data }) => JSON.parse(data.result)),
        {
          retries
        })
      if (cache) {
        await cache.set(`${network}:${contractAddress}`, abi)
      }

      return abi
    } catch (error) {
      throw new Error(`Couldn't fetch ABI for ${contractAddress}`)
    }
  }

  async get (contractAddress: string, network: Network, proxyFetchMode?: ProxyFetchMode): Promise<JsonFragment[]> {
    const { rpcProviderUrl, implementationStorageLocations, proxyFetchMode: defaulProxyFetchMode } = this.options
    proxyFetchMode = proxyFetchMode || defaulProxyFetchMode
    const originalAbi = await this._get(contractAddress, network)

    if (proxyFetchMode !== 'proxyOnly') {
      const provider = new JsonRpcProvider(rpcProviderUrl[network])
      let implementationAddress: string
      let implementationAbi: JsonFragment[] = []

      if (originalAbi.some(item => item.type === 'function' && item.name === 'implementation')) {
        // EIP-897 DelegateProxy
        if (originalAbi.some(item => item.type === 'function' && item.name === 'proxyType')) {
          const contract = new Contract(contractAddress, originalAbi, provider)
          implementationAddress = await contract.implementation()
        } else { //  EIP-1967: Standard Proxy Storage Slots
          for (const implementationStorageLocation of implementationStorageLocations) {
            if (implementationAddress) { break }

            try {
              const implementation = await provider.getStorageAt(contractAddress, implementationStorageLocation)
              const address = getAddress(`0x${implementation.slice(-40)}`)

              if (address && address !== '0x0000000000000000000000000000000000000000') {
                implementationAddress = address
              }
            } catch (error) {

            }
          }
        }

        if (implementationAddress) {
          implementationAbi = await this._get(implementationAddress, network)
          return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
        } else if (proxyFetchMode === 'implementationOnly') {
          throw new Error(`Couldn't fetch ImplementationOnly ABI for ${contractAddress}`)
        } else {
          return originalAbi
        }
      } else if (originalAbi.some(item => item.type === 'function' && item.name === 'getDummyImplementation')) {
        const contract = new Contract(contractAddress, originalAbi, provider)

        implementationAddress = await contract.getDummyImplementation()
        implementationAbi = await this._get(implementationAddress, network)
        return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
      }
    }

    return originalAbi
  }
}
