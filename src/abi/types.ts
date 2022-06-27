import type { JsonFragment } from '@ethersproject/abi'

export type Network = 'polygon' | 'mainnet' | 'fantom' | 'arbitrum' | 'avalanche' | 'optimism';
export type ProxyFetchMode = 'proxyOnly' | 'implementationOnly' | 'proxyAndImplementation';
export type AbiType = 'function' | 'constructor' | 'event' | 'fallback';
export type StateMutabilityType = 'pure' | 'view' | 'nonpayable' | 'payable';

export interface ICache {
    get(key: string): PromiseLike<JsonFragment[]> | JsonFragment[] | undefined;
    set(key: string, value: JsonFragment[]): PromiseLike<boolean> | boolean
}

export interface IAbiFetcherOptions {
    retries: number,
    implementationStorageLocations: string[],
    cache?: ICache
    etherscanApiKey?: Partial<Record<Network, string>>
    rpcProviderUrl: Partial<Record<Network, string>>
    networkToEtherscanAPI: Partial<Record<Network, string>>,
    proxyFetchMode: ProxyFetchMode
}
