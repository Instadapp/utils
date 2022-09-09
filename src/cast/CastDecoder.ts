import { Interface, defaultAbiCoder } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { Contract } from '@ethersproject/contracts'
import { AbiFetcher } from '../abi'
import { JsonRpcRetryProvider } from '../providers'
import { Network } from '../types'
import { ICastDecoderOptions } from './types'
const connectorsV1AddressToName = {
  '0xe5398f279175962e56fe4c5e0b62dc7208ef36c6': 'basic',
  '0xd1aff9f2acf800c876c409100d6f39aea93fc3d9': 'authority',
  '0x94dfafcc80b8460acf1cbc5cac17bd83c95e9992': 'compound',
  '0x15fdd1e902cac70786fe7d31013b1a806764b5a2': 'compound_old',
  '0x0f3979ac12b74878af11cfee67b9bbb2520b3ba6': 'maker',
  '0xac02030d8a8f49ed04b2f52c394d3f901a10f8a9': 'maker_old',
  '0xcef5f3c402d4fef76a038e89a4357176963e1464': 'instapool',
  '0xe554c84c030bd5e850cdbd17f6583818b8de5b1f': 'oasis',
  '0x7043fc2e21865c091eeae37c38e3d82bccdf5d5c': 'kyber',
  '0xc74902ad45c8223da10efdcff2ded12184e9d9b5': 'curve',
  '0xe3bc928d9daa89a0f08cf77b227b7080b9a5105d': 'curve_sbtc',
  '0x861a2250fcdbe57041289623561d5d79585df5dc': 'curve_y',
  '0x996b5247ff7fa67cdea16e5de29b8bfeef557a29': 'oneInch',
  '0x6af6c791c869dfa65f8a2fa042fa47d1535bef25': 'dydx',
  '0x1d662fe55b10759ce69c3a6805259eb545bd5738': 'aave',
  '0xcb5cbc3f397e0024fac67cf6dd465e02ca91c215': 'migrate',
  '0xdc9f393d5f4c12f1c1049035c20d58bd624510e3': 'compoundImport',
  '0x3f4b307d501417ca0f928958a27191aa6657d38d': 'uniswap',
  '0xfb8a92e017e3416c0f63c28c53195337ebdeba2e': 'comp',
  '0xe5b66b785bd6b6708bb814482180c136ddbcd687': 'staking',
  '0xb86437e80709015d05354c35e54b7c8b11a58687': 'chi',
  '0xf5e14d35706971b6aad7a67b1a8e9a1ef7870be9': 'curve_claim',
  '0xaf615b36db171fd5a369a0060b9bcb88fff0190d': 'curve_gauge',
  '0x25ad59adbe00c2d80c86d01e2e05e1294da84823': 'gelato',
  '0xe5a7bdd3336245142ad3a153838ecfb490a5e044': 'dydx_flash',
  '0x8b302dc8a97a63eb468715b8c30f7003b86e9f01': 'swerve',
  '0x1568a9d336a7ac051dcc4bdcc4a0b09299de5daf': 'curve_three',
  '0x2a26228e607ffd2ab2bd3aa49cbae0edc6469bf8': 'instapool_v2',
  '0x0ad8cc89bfb3b265a6de52438a26a44c6d66e74e': 'compoundImport_v2',
  '0xa007f98ab41b0b4520701cb2ac75e802c460db4c': 'math',
  '0x53edf7fc8bb9c249694ea0a2174043553b34db27': 'aave_v2',
  '0xd3914a73367f8015070f073d5c69602f3a48b80d': 'aave_migrate',
  '0x5fa9455ce54bd5723443c6d3d614693e3429b57f': 'fee',
  '0xd45dfa34ceeab567208041331f5ed9916c23b1e8': 'refinance',
  '0xcfc2a047887a4026a7e866f7ec1404f30d6a6f31': 'aave_v2_import',
  '0x4a9e4827e884cb3e49406e3a1a678f75910b1bb9': 'aave_v1_import',
  '0x62659fe13c254100eb354ad2226a8fdddbc6dac6': 'polygon_bridge',
  '0x9686ce6ad5c3f7b212caf401b928c4bb3422e7ba': 'aave_polygon_migrate',
  '0x8f1e38c53af7bd2b2be01b9580911b7cca504f1b': 'aave_claim',
  '0xa96b2f679fb935ba279ea9395402ca4696d64d78': 'aave_stake',
  '0x4f774c123d012a6cfd5918b7f4ce7d3386ca727d': 'dsa_migrate_v1_to_v2'
}
const DSA_V1_CAST_ABI = ['function cast(address[] _targets, bytes[] _datas, address _origin)']
const DSA_V2_CAST_ABI = ['function cast(string[] calldata _targetNames, bytes[] calldata _datas, address _origin)']
const dsaV1Interface = new Interface(DSA_V1_CAST_ABI)
const dsaV2Interface = new Interface(DSA_V2_CAST_ABI)
const DEFAULTS: ICastDecoderOptions = {
  instaConnectorsAddresses: {
    polygon: '0x2A00684bFAb9717C21271E0751BCcb7d2D763c88',
    mainnet: '0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11',
    avalanche: '0x127d8cD0E2b2E0366D522DeA53A787bfE9002C14',
    optimism: '0x127d8cD0E2b2E0366D522DeA53A787bfE9002C14',
    arbitrum: '0x67fCE99Dd6d8d659eea2a1ac1b8881c57eb6592B',
    fantom: '0x819910794a030403F69247E1e5C0bBfF1593B968'
  }
}

type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any

export class CastDecoder {
  options: ICastDecoderOptions

  constructor (options?: Partial<ICastDecoderOptions>) {
    this.options = Object.assign({}, DEFAULTS, options)
    this.options.abiFetcher = this.options.abiFetcher || new AbiFetcher()
  }

  getEncodedSpells (data: string) {
    try {
      const isDsaV2 = data.startsWith('0x9304c934')
      const tx = (isDsaV2 ? dsaV2Interface : dsaV1Interface).parseTransaction({ data })

      return {
        targets: isDsaV2 ? tx.args._targetNames : tx.args._targets,
        spells: tx.args._datas
      }
    } catch (error) {
      throw new Error("Can't decode spells")
    }
  }

  async getConnectorAbi (connectorName: string, network: Network = 'mainnet', metadata?: Record<string, any> & { blockNumber?: number | string }) {
    if (isAddress(connectorName)) {
      return await this.options.abiFetcher.get(connectorName, network, this.options.abiFetcher.options.proxyFetchMode, metadata)
    }

    const instaConnectorsAddress = this.options.instaConnectorsAddresses[network]

    const contract = new Contract(instaConnectorsAddress, [
      {
        inputs:
          [{ internalType: 'string', name: '', type: 'string' }],
        name: 'connectors',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
      }
    ], new JsonRpcRetryProvider(this.options.abiFetcher.options.rpcProviderUrl[network]))

    const contractAddress = await contract.connectors(connectorName, {
      blockTag: metadata && metadata.blockNumber ? metadata.blockNumber : 'latest'
    })

    return await this.options.abiFetcher.get(contractAddress, network, this.options.abiFetcher.options.proxyFetchMode, metadata)
  }

  async getSpell (connectorName: string, data: string, network: Network = 'mainnet', metadata?: Record<string, any> & { blockNumber?: number | string }) {
    const spell = {
      connector: isAddress(connectorName) ? (connectorsV1AddressToName[connectorName.toLowerCase()] || connectorName) : connectorName,
      data,
      method: null,
      args: [],
      namedArgs: {},
      flashloanSpells: undefined
    }

    const abi = await this.getConnectorAbi(connectorName, network, metadata)

    const connector = new Interface(abi)

    const tx = connector.parseTransaction({ data: spell.data })

    spell.method = tx.name
    spell.args = [...tx.args].map((arg) => {
      if (Array.isArray(arg)) {
        return arg.map(String)
      }

      return String(arg)
    })
    spell.namedArgs = Object.keys({ ...tx.args }).reduce((acc, key) => {
      if (isNaN(Number(key))) {
        const arg = tx.args[key]
        acc[key] = Array.isArray(arg) ? arg.map(String) : String(arg)
      }
      return acc
    }, {})

    try {
      if (spell.connector === 'INSTAPOOL-C' && ['flashBorrowAndCast', 'flashMultiBorrowAndCast'].includes(spell.method)) {
        const [targets, spells] = defaultAbiCoder.decode(['string[]', 'bytes[]'], (spell.namedArgs as any).data)
        spell.flashloanSpells = await this.getSpells({
          targets,
          spells
        }, network, metadata)
      }
    } catch (error) {
    }

    return spell
  }

  async getSpells (data: string | { targets: string[], spells: string[] }, network: Network = 'mainnet', metadata?: Record<string, any>) {
    const encodedSpells = typeof data === 'string' ? this.getEncodedSpells(data) : data

    const spells: AsyncReturnType<typeof this.getSpell>[] = []
    for (let index = 0; index < encodedSpells.targets.length; index++) {
      const spell = await this.getSpell(encodedSpells.targets[index], encodedSpells.spells[index], network, metadata)

      spells.push(spell)
    }

    return spells
  }

  async getEventNamedArgs (connectorName: string, eventName: string, eventParam: string, network: Network = 'mainnet', metadata?: Record<string, any> & { blockNumber?: number | string }) {
    const abi = await this.getConnectorAbi(connectorName, network, metadata)

    const connector = new Interface(abi.map(item => ({
      ...item,
      inputs: item.inputs
        ? item.inputs.map(input => ({
          ...input,
          indexed: false
        }))
        : []
    })))

    const log = connector.decodeEventLog(eventName, eventParam)

    return Object.keys(log).reduce((acc, key) => {
      if (isNaN(Number(key))) {
        acc[key] = String(log[key])
      }
      return acc
    }, {})
  }
}
