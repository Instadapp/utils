import axios from 'axios'
import { retry } from '../promises'
import { Chain, getChainScanUrls } from './chain'
import { ERC1155TokenTransferEvent, ERC20TokenTransferEvent, ERC721TokenTransferEvent, InternalTransaction, NormalTransaction } from './types'

export interface BlockscanOptions {
  apiUrl?: string
  baseUrl?: string
  timeouts?: number[]
  timeoutDelay?: number
}

export class Blockscan {
  apiUrl: string
  baseUrl: string
  timeouts = [5_000, 10_000, 15_000]
  timeoutDelay = 500

  /**
   * Create a new client with the correct endpoints based on the chain and provided API key
  */
  constructor (private chain: Chain | number, private apiKey?: string, options?: BlockscanOptions) {
    if (options?.timeouts && options.timeouts.length > 0) {
      this.timeouts = options.timeouts
    }

    if (options?.timeoutDelay) {
      this.timeoutDelay = options.timeoutDelay
    }

    if (chain === Chain.Custom) {
      if (!options?.apiUrl) {
        throw new Error('Custom chain requires apiUrl')
      }

      if (!options?.baseUrl) {
        throw new Error('Custom chain requires baseUrl')
      }

      this.apiUrl = options.apiUrl
      this.baseUrl = options.baseUrl
    } else {
      const { base, api } = getChainScanUrls(chain)

      this.apiUrl = api
      this.baseUrl = base
    }
  }

  /**
   * Create a new client with custom endpoints
  */
  static custom (baseUrl: string, apiUrl: string, apiKey?: string) {
    return new Blockscan(Chain.Custom, apiKey, { baseUrl, apiUrl })
  }

  /**
   *  Fetches a contract's verified source code and its metadata.
   */
  async contractSourceCode (address: string): Promise<any[]> {
    return await this.query({
      module: 'contract',
      action: 'getsourcecode',
      address
    })
  }

  /**
   *  Returns the list of transactions performed by an address, with optional pagination.
   */
  async getTransactions (user: string, params?: {
    startblock?: number,
    endblock?: number,
    sort?: 'asc' | 'desc',
    page?: number,
    offset?: number
  }): Promise<NormalTransaction[]> {
    return await this
      .query({
        module: 'account',
        action: 'txlist',
        address: user,
        ...params
      })
      .catch((error) => {
        if (error.message.includes('No transactions found')) {
          return []
        }

        throw error
      })
  }

  /**
   *  Returns the list of internal transactions performed by an address or within a transaction, with optional pagination.
   */
  async getInternalTransactions (user: string, params?: {
    startblock?: number,
    endblock?: number,
    sort?: 'asc' | 'desc',
    page?: number,
    offset?: number
  }): Promise<InternalTransaction[]> {
    return await this
      .query({
        module: 'account',
        action: 'txlistinternal',
        address: user,
        ...params
      }).catch((error) => {
        if (error.message.includes('No transactions found')) {
          return []
        }

        throw error
      })
  }

  /**
   *  Returns the list of ERC-20 tokens transferred by an address, with optional filtering by token contract.
   */
  async getErc20TokenTransferEvents (
    eventQuery: { address: string } | { contract: string } | { address: string, contract: string },
    params?: {
      startblock?: number,
      endblock?: number,
      sort?: 'asc' | 'desc',
      page?: number,
      offset?: number
    }): Promise<ERC20TokenTransferEvent[]> {
    return await this
      .query({
        module: 'account',
        action: 'tokentx',
        ...eventQuery,
        ...params
      }).catch((error) => {
        if (error.message.includes('No transactions found')) {
          return []
        }

        throw error
      })
  }

  /**
   *  Returns the list of ERC-721 ( NFT ) tokens transferred by an address, with optional filtering by token contract.
   */
  async getErc721TokenTransferEvents (
    eventQuery: { address: string } | { contract: string } | { address: string, contract: string },
    params?: {
      startblock?: number,
      endblock?: number,
      sort?: 'asc' | 'desc',
      page?: number,
      offset?: number
    }): Promise<ERC721TokenTransferEvent[]> {
    return await this
      .query({
        module: 'account',
        action: 'tokennfttx',
        ...eventQuery,
        ...params
      }).catch((error) => {
        if (error.message.includes('No transactions found')) {
          return []
        }

        throw error
      })
  }

  /**
   *  Returns the list of ERC-1155 ( NFT ) tokens transferred by an address, with optional filtering by token contract.
   */
  async getErc1155TokenTransferEvents (
    eventQuery: { address: string } | { contract: string } | { address: string, contract: string },
    params?: {
      startblock?: number,
      endblock?: number,
      sort?: 'asc' | 'desc',
      page?: number,
      offset?: number
    }): Promise<ERC1155TokenTransferEvent[]> {
    return await this
      .query({
        module: 'account',
        action: 'token1155tx',
        ...eventQuery,
        ...params
      }).catch((error) => {
        if (error.message.includes('No transactions found')) {
          return []
        }

        throw error
      })
  }

  public async query (params: { module: string, action: string, [key: string]: any }) {
    params = Object.assign(
      {
        endblock: '99999999',
        sort: 'asc',
        offset: '10000',
        startblock: '0',
        page: '0'
      },
      params,
      { apikey: this.apiKey }
    )

    return await retry(async () => {
      try {
        const { data } = await axios.get(this.apiUrl, { params })
        if (data.status !== '1') {
          throw new Error(typeof data.result === 'string' ? data.result : data.message)
        }

        return data.result
      } catch (error) {
        throw new Error(error.message)
      }
    }, {
      timeouts: this.timeouts,
      delay: this.timeoutDelay
    })
  }
}
