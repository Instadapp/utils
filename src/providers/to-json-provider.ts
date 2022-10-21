import { Web3Provider, JsonRpcProvider } from '@ethersproject/providers'
import type { ExternalProvider } from '@ethersproject/providers'

export const toJsonRpcProvider = (providerOrUrl: Pick<ExternalProvider, 'request' | 'send'> | Web3Provider | JsonRpcProvider | string): JsonRpcProvider => {
  if (typeof providerOrUrl === 'string') {
    return new JsonRpcProvider(providerOrUrl)
  } else if (providerOrUrl instanceof Web3Provider || providerOrUrl instanceof JsonRpcProvider) {
    return providerOrUrl as any
  } else if ('request' in providerOrUrl || 'send' in providerOrUrl) {
    return new Web3Provider(providerOrUrl)
  } else {
    return providerOrUrl as any as JsonRpcProvider
  }
}
