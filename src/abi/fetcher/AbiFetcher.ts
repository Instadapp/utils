import { getAddress } from '@ethersproject/address'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import retry from 'async-retry'
import axios from 'axios'
import type { JsonFragment } from '@ethersproject/abi'
import { IAbiFetcherOptions, Network, ProxyFetchMode } from '../types'

const DEFAULTS: IAbiFetcherOptions = {
  retries: 3,
  implementationStorageLocation: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
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
    const { rpcProviderUrl, implementationStorageLocation, proxyFetchMode: defaulProxyFetchMode } = this.options
    proxyFetchMode = proxyFetchMode || defaulProxyFetchMode
    const originalAbi = await this._get(contractAddress, network)

    if (proxyFetchMode !== 'proxyOnly') {
      const provider = new JsonRpcProvider(rpcProviderUrl[network])
      let implementationAddress: string
      let implementationAbi: JsonFragment[]

      if (originalAbi.some(item => item.type === 'function' && item.name === 'implementation')) {
        // EIP-897 DelegateProxy
        if (originalAbi.some(item => item.type === 'function' && item.name === 'proxyType')) {
          const contract = new Contract(contractAddress, originalAbi)
          implementationAddress = await contract.implementation()
        } else { //  EIP-1967: Standard Proxy Storage Slots
          const implementation = await provider.getStorageAt(contractAddress, implementationStorageLocation)
          implementationAddress = getAddress(`0x${implementation.slice(-40)}`)
        }

        implementationAbi = await this._get(implementationAddress, network)
        return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
      } else if (originalAbi.some(item => item.type === 'function' && item.name === 'getDummyImplementation')) {
        const contract = new Contract(contractAddress, originalAbi)

        implementationAddress = await contract.getDummyImplementation()
        implementationAbi = await this._get(implementationAddress, network)
        return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
      }
    }

    return originalAbi
  }
}
