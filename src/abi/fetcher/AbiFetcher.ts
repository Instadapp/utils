import { getAddress } from '@ethersproject/address'
import { Contract } from '@ethersproject/contracts'
import retry from 'async-retry'
import axios from 'axios'
import type { JsonFragment } from '@ethersproject/abi'
import { IAbiFetcherOptions, ProxyFetchMode } from '../types'
import { Network } from '../../types'
import { JsonRpcRetryProvider } from '../../providers'

const DEFAULTS: IAbiFetcherOptions = {
  retries: 3,
  implementationStorageLocations: [
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3'
  ],
  proxyFetchMode: 'proxyAndImplementation',
  rpcProviderUrl: {
    polygon: 'https://polygon-rpc.com',
    mainnet: 'https://eth.drpc.org',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    optimism: 'https://mainnet.optimism.io',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    fantom: 'https://rpc.ftm.tools',
    bsc: 'https://bsc-dataseed.binance.org',
    gnosis: 'https://rpc.gnosischain.com',
    'polygon-zkevm': 'https://zkevm-rpc.com',
    base: 'https://mainnet.base.org',
    fuse: 'https://rpc.fuse.io'
  },
  networkToEtherscanAPI: {
    polygon: 'https://api.polygonscan.com/api',
    mainnet: 'https://api.etherscan.io/api',
    avalanche: 'https://api.snowtrace.io/api',
    optimism: 'https://api-optimistic.etherscan.io/api',
    arbitrum: 'https://api.arbiscan.io/api',
    fantom: 'https://api.ftmscan.com/api',
    bsc: 'https://api.bscscan.com/api',
    gnosis: 'https://api.gnosisscan.io/api',
    'polygon-zkevm': 'https://api-zkevm.polygonscan.com/api',
    base: 'https://api.basescan.org/api'
  },
  networkToBlockscoutV4Graph: {
    aurora: 'https://explorer.aurora.dev/graphiql'
  },
  networkToBlockscoutV5Api: {
    fuse: 'https://explorer.fuse.io/api'
  }
}

export class AbiFetcher {
  options: IAbiFetcherOptions

  constructor (options?: Partial<IAbiFetcherOptions>) {
    this.options = Object.assign({}, DEFAULTS, options)
  }

  private async fetchABI (contractAddress: string, network: Network): Promise<JsonFragment[]> {
    const { networkToEtherscanAPI, networkToBlockscoutV4Graph, networkToBlockscoutV5Api } = this.options

    if (networkToEtherscanAPI[network]) {
      return await this.fetchABIFromEtherscan(contractAddress, network)
    }

    if (networkToBlockscoutV4Graph[network]) {
      return await this.fetchABIFromBlockscoutV4(contractAddress, network)
    }

    if (networkToBlockscoutV5Api[network]) {
      return await this.fetchABIFromBlockscoutV5(contractAddress, network)
    }

    throw new Error(`Couldn't fetch ABI for ${contractAddress}`)
  }

  private async fetchABIFromEtherscan (contractAddress: string, network: Network): Promise<JsonFragment[]> {
    const { retries, networkToEtherscanAPI, etherscanApiKey } = this.options

    return await retry(
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
  }

  private async fetchABIFromBlockscoutV4 (contractAddress: string, network: Network): Promise<JsonFragment[]> {
    const { retries, networkToBlockscoutV4Graph } = this.options

    return await retry(
      async () =>
        await axios
          .post(
            networkToBlockscoutV4Graph[network],
            {
              query: `{\n  address(hash:"${contractAddress}") {\n    \tsmartContract {\n        abi\n      }\n  }\t\n}`,
              variables: null,
              operationName: null
            }
          )
          .then(({ data: { data } }) => {
            if (data.errors) {
              throw new Error(data.errors[0].message)
            }

            return JSON.parse(data.address.smartContract.abi)
          }),
      {
        retries
      })
  }

  private async fetchABIFromBlockscoutV5 (contractAddress: string, network: Network): Promise<JsonFragment[]> {
    const { retries, networkToBlockscoutV5Api } = this.options

    return await retry(
      async () =>
        await axios
          .get(
            `${networkToBlockscoutV5Api[network]}/v2/smart-contracts/${contractAddress}`
          )
          .then(({ data }) => {
            return data.abi
          }),
      {
        retries
      })
  }

  private async _get (contractAddress: string, network: Network, metadata?: Record<string, any>): Promise<JsonFragment[]> {
    const { cache } = this.options

    try {
      getAddress(contractAddress)
    } catch (error) {
      throw new Error('Invalid contract address')
    }

    const cacheKey = `${network}:${contractAddress}`

    if (cache) {
      try {
        const abi = await cache.get(cacheKey, network, metadata)

        if (abi) {
          return abi
        }
      } catch (error) {

      }
    }

    try {
      const abi = await this.fetchABI(contractAddress, network)
      if (cache) {
        try {
          await cache.set(`${network}:${contractAddress}`, abi, network, metadata)
        } catch (error) {

        }
      }

      return abi
    } catch (error) {
      throw new Error(`Couldn't fetch ABI for ${contractAddress}`)
    }
  }

  async get (contractAddress: string, network: Network, proxyFetchMode?: ProxyFetchMode, metadata?: Record<string, any>): Promise<JsonFragment[]> {
    const { rpcProviderUrl, implementationStorageLocations, proxyFetchMode: defaulProxyFetchMode } = this.options
    proxyFetchMode = proxyFetchMode || defaulProxyFetchMode
    const originalAbi = await this._get(contractAddress, network, metadata)

    if (proxyFetchMode !== 'proxyOnly') {
      const provider = new JsonRpcRetryProvider(rpcProviderUrl[network])
      let implementationAddress: string
      let implementationAbi: JsonFragment[] = []

      if (originalAbi.some(item => item.type === 'function' && item.name === 'implementation')) {
        // EIP-897 DelegateProxy
        if (originalAbi.some(item => item.type === 'function' && item.name === 'proxyType')) {
          const contract = new Contract(contractAddress, originalAbi, provider as any)
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
          implementationAbi = await this._get(implementationAddress, network, metadata)
          return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
        } else if (proxyFetchMode === 'implementationOnly') {
          throw new Error(`Couldn't fetch ImplementationOnly ABI for ${contractAddress}`)
        } else {
          return originalAbi
        }
      } else if (originalAbi.some(item => item.type === 'function' && item.name === 'getDummyImplementation')) {
        const contract = new Contract(contractAddress, originalAbi, provider as any)

        implementationAddress = await contract.getDummyImplementation()
        implementationAbi = await this._get(implementationAddress, network, metadata)
        return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
      } else if (originalAbi.some(item => item.type === 'function' && item.name === 'implementations')) {
        const contract = new Contract(contractAddress, originalAbi, provider as any)

        implementationAddress = await contract.implementations()
        implementationAbi = await this._get(implementationAddress, network, metadata)
        return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
      } else if (originalAbi.some(item => item.type === 'function' && item.name === 'comptrollerImplementation')) {
        const contract = new Contract(contractAddress, originalAbi, provider as any)

        implementationAddress = await contract.comptrollerImplementation()
        implementationAbi = await this._get(implementationAddress, network, metadata)
        return proxyFetchMode === 'implementationOnly' ? implementationAbi : [...originalAbi, ...implementationAbi]
      }
    }

    return originalAbi
  }
}
