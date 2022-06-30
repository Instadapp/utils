import { AbiFetcher } from '../abi'
import { Network } from '../types'

export interface ICastDecoderOptions {
    abiFetcher?: AbiFetcher
    instaConnectorsAddresses: Record<Network, string>
}
