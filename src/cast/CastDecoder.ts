import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { AbiFetcher } from '../abi'
import { Network } from '../types'
import { ICastDecoderOptions } from './types'
const DSA_V2_CAST_ABI = ['function cast(string[] calldata _targetNames, bytes[] calldata _datas, address _origin)']
const dsaV2Interface = new Interface(DSA_V2_CAST_ABI)
const DEFAULTS: ICastDecoderOptions = {
  rpcProviderUrl: {
    polygon: 'https://rpc.ankr.com/polygon',
    mainnet: 'https://rpc.ankr.com/eth',
    avalanche: 'https://rpc.ankr.com/avalanche',
    optimism: 'https://rpc.ankr.com/optimism',
    arbitrum: 'https://rpc.ankr.com/arbitrum',
    fantom: 'https://rpc.ankr.com/fantom'
  }
}

const instaConnectorsAddresses: Record<Network, string> = {
  polygon: '0x2A00684bFAb9717C21271E0751BCcb7d2D763c88',
  mainnet: '0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11',
  avalanche: '0x127d8cD0E2b2E0366D522DeA53A787bfE9002C14',
  optimism: '0x127d8cD0E2b2E0366D522DeA53A787bfE9002C14',
  arbitrum: '0x67fCE99Dd6d8d659eea2a1ac1b8881c57eb6592B',
  fantom: '0x819910794a030403F69247E1e5C0bBfF1593B968'
}

export class CastDecoder {
  options: ICastDecoderOptions

  constructor (options?: Partial<ICastDecoderOptions>) {
    this.options = Object.assign({}, DEFAULTS, options)
    this.options.abiFetcher = this.options.abiFetcher || new AbiFetcher()
  }

  getEncodedSpells (data: string) {
    try {
      const tx = dsaV2Interface.parseTransaction({ data })
      return {
        targets: tx.args._targetNames,
        spells: tx.args._datas
      }
    } catch (error) {
      throw new Error("Can't decode spells")
    }
  }

  async getConnectorAbi (connectorName: string, network: Network) {
    const instaConnectorsAddress = instaConnectorsAddresses[network]

    const contract = new Contract(instaConnectorsAddress, [
      {
        inputs:
          [{ internalType: 'string', name: '', type: 'string' }],
        name: 'connectors',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
      }
    ], new JsonRpcProvider(this.options.rpcProviderUrl[network]))

    const contractAddress = await contract.connectors(connectorName)

    return await this.options.abiFetcher.get(contractAddress, network)
  }

  async getSpells (data: string, network: Network) {
    const encodedSpells = this.getEncodedSpells(data)

    const spells = encodedSpells.targets.map((target, index) => ({
      connector: target,
      data: encodedSpells.spells[index],
      method: null,
      args: [],
      namedArgs: {}
    }))

    for (const spell of spells) {
      const abi = await this.getConnectorAbi(spell.connector, network)

      const connector = new Interface(abi)

      const tx = connector.parseTransaction({ data: spell.data })

      spell.method = tx.name
      spell.args = [...tx.args].map(String)
      spell.namedArgs = Object.keys({ ...tx.args }).reduce((acc, key) => {
        if (isNaN(Number(key))) {
          acc[key] = String(tx.args[key])
        }
        return acc
      }, {})
    }

    return spells
  }
}
