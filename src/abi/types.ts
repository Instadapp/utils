import type { JsonFragment } from '@ethersproject/abi'
import { Network } from '../types'

export type ProxyFetchMode = 'proxyOnly' | 'implementationOnly' | 'proxyAndImplementation';
export type AbiType = 'function' | 'constructor' | 'event' | 'fallback';
export type StateMutabilityType = 'pure' | 'view' | 'nonpayable' | 'payable';

export interface ICache {
    get(key: string, network: Network | string, metadata?: Record<string, any>): PromiseLike<JsonFragment[]> | JsonFragment[] | undefined;
    set(key: string, value: JsonFragment[], network: Network | string, metadata?: Record<string, any>): PromiseLike<any> | any
}

export interface IAbiFetcherOptions {
    /**
     *  @default 3
     */
    retries: number,
    /**
     * @default
        [
            '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
            '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3'
        ]
     */
    implementationStorageLocations: string[],
    cache?: ICache
    etherscanApiKey?: Partial<Record<Network, string>>
    /**
     *  @default
        {
            polygon: 'https://rpc.ankr.com/polygon',
            mainnet: 'https://rpc.ankr.com/eth',
            avalanche: 'https://rpc.ankr.com/avalanche',
            optimism: 'https://rpc.ankr.com/optimism',
            rbitrum: 'https://rpc.ankr.com/arbitrum',
            fantom: 'https://rpc.ankr.com/fantom'
        }
     */
    rpcProviderUrl: Partial<Record<Network, string>>
    /**
     *  @default
      {
            polygon: 'https://api.polygonscan.com/api',
            mainnet: 'https://api.etherscan.io/api',
            avalanche: 'https://api.snowtrace.io/api',
            optimism: 'https://api-optimistic.etherscan.io/api',
            arbitrum: 'https://api.arbiscan.io/api',
            fantom: 'https://api.ftmscan.com/api'
        }
     */
    networkToEtherscanAPI: Partial<Record<Network, string>>,
    /**
     *  @default
      {
            aurora: 'https://explorer.aurora.dev/graphiql',
            fuse: 'https://explorer.fuse.io/graphiql',
        }
     */
    networkToBlockscoutAPI: Partial<Record<Network, string>>,
    /**
     *  @default proxyAndImplementation
     */
    proxyFetchMode: ProxyFetchMode
}
