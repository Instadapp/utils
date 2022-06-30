import { AbiFetcher } from '../abi'
import { Network } from '../types'

export interface ICastDecoderOptions {
    abiFetcher?: AbiFetcher

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
}
