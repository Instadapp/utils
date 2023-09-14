import { Interface, defaultAbiCoder } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { Contract } from '@ethersproject/contracts'
import { AbiFetcher } from '../abi'
import { JsonRpcRetryProvider } from '../providers'
import { Network } from '../types'
import { ICastDecoderOptions } from './types'

const connectorsV1AddressToName: Record<Lowercase<string>, string> = {
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

const connectorsV2AddressToName: Record<Lowercase<string>, string> = {
  // '0x1d2663d4e2a58323ae63cc571375934ad9c993eC': '1INCH-A',
  '0x1d2663d4e2a58323ae63cc571375934ad9c993ec': '1INCH-V5-A',
  '0x16ac1e894abb854519243e9ff982673ab5497549': '1INCH-V4-A',
  '0x235fca310ac7be45c7ad45f111203468743e4b7c': '1INCH-V3-A',
  '0x612c5ca43230d9f97a0ac87e4420f66b8df97e9d': 'AAVE-V1-A',
  '0xdb8e3f36c6f4368cb2c023f41225428e366b0b2a': 'AAVE-V2-A',
  '0xea649c4f93260951eda9255e2687ba269e6c1e9f': 'AAVE-V3-A',
  '0xfe0ccfac4b1502259bb2359e25f6bc732de93c56': 'AAVE-V3-CLAIM-A',
  '0x1ce060fa89b927fd66b0e38c436b0a1730fcecd9': 'AAVE-V3-IMPORT-PERMIT-A',
  '0x6ce3e607c808b4f4c26b7f6adaeb619e49cabb25': 'AUTHORITY-A',
  '0x93f44b2d8fea5a9609f8259613a1a06703f8defc': 'BASIC-A',
  '0xb446e325d44c52b93ec122bf76301f235f90b9c9': 'COMP-A',
  '0xbb153cf09a123746e0eb3b3a436c544a7eeb24b6': 'COMPOUND-A',
  '0x4049db23c605b197f764072569b8db2464653ef6': 'MAKERDAO-A',
  '0xa4bf319968986d2352fa1c550d781bbfcce3fcab': 'UNISWAP-A',
  '0x1b79b302132370b434fb7807b36cb72fb0510ad5': 'POLYGON-BRIDGE-A',
  '0x611c1fa59aa1d6352c4c8bd44882063c6aee85e0': 'AAVE-CLAIM-A',
  '0xf73c94402bc24148b744083ed02654eec2c37d5b': 'AAVE-STAKE-A',
  '0x8358a92707824476f0d788075d53b627e85490a7': 'AAVE-V1-IMPORT-A',
  '0x89305678cc853a929428fa6a97ab35bd864e3f14': 'AAVE-V2-IMPORT-A',
  '0xf2113d0c99f36d7d6f6c6faf05e0863892255999': 'COMPOUND-IMPORT-A',
  '0x5806af7ab22e2916fa582ff05731bf7c682387b2': 'INSTAPOOL-A',
  '0xda101870ca6136539628f28041e1b55baf4eb6c0': 'COMPOUND-IMPORT-B',
  '0x6fe05374924830b6ac98849f75a3d5766e51ef10': 'AAVE-V2-IMPORT-B',
  '0x2f8cbe650af98602a215b6482f2ad60893c5a4e8': 'MAKERDAO-CLAIM-A',
  '0x2fca923c7535083f25f761dcf289d7d81f024dda': 'G-UNISWAP-A',
  '0xd5bf0631d75da227cd1b6d2785929015d849f56d': 'STAKE-ERC20-A',
  '0x37a63939e128d284e0eae5d3e517aad44f5204d4': 'INST-STAKING-A',
  '0xabac3dcf164ed827eafda8e05ecc8208d6bc5e04': '1INCH-B',
  '0x22075fa719efb02ca3cf298afa9c974b7465e5d3': 'WETH-A',
  '0x52c2c4a0db049255ff345eb9d3fb1f555b7a924a': 'INST-A',
  '0x9ea34be6da51aa9f6408fea79c946fdcfa424442': 'REFINANCE-A',
  '0xbe4ea1a66b31037b4ae3495ad2d86ea20622d9d1': 'INST-LM-A',
  '0x1e5ce41bdb653734445fec3553b61febddafc43c': 'UNISWAP-V2-A',
  '0xee619922b3a1334c798b0b756dd19077e34822c9': 'LIQUITY-A',
  '0xac6dc28a6251f49bbe5755e630107dccde9ae2c8': 'REFLEXER-A',
  '0x25b0c76de86c3457b9b8b9ee3775f5a7b8d4c475': 'UNISWAP-V3-A',
  '0xa3eefdc2de9dfa59968becff3e15b53e6162460f': 'B-COMPOUND-A',
  '0xb0a1f10feefecf25064ce7cdf0a65042f7de7bf0': 'B-MAKERDAO-A',
  '0x19574e5dfb40bbd63a4f3bdcf27ed662b329b2ff': 'B-LIQUITY-A',
  '0x4dfa1780ae85f0ec7197c61ffe533c7dc84f15e9': 'BASIC-B',
  '0x6ecbf5a77d65f857c66fe729cb3cd7835369c42b': 'BASIC-C',
  '0xf33236f1122bfb02aaf73483e72b1da9847c8510': 'UNISWAP-V3-STAKE-A',
  '0x598522c536612550be09f01de201a6634dafa307': 'YEARN-VAULT-A',
  '0xb8e9ef2a085671858d923aa947cb93b88714d2f8': 'INST-STAKING-B',
  '0x825832a5a589ed9500caee2aa2d2c3117218d6a9': 'GELATO-AAVE-A',
  '0xbf254fa556703c78d70b4cec8459d1ff2b33cd87': 'POOLTOGETHER-A',
  '0x08bae28d448d1aacac2eaa850e9098274f0c7222': 'INSTAPOOL-B',
  '0xda6312a54fa0af8a49f99f3a16f63c8d4e8db82c': 'COMPOUND-IMPORT-C',
  '0x0bbaeadf17eb7c49dc18dde89aa661c2bfbf4c12': 'AAVE-V2-IMPORT-C',
  '0x1f882522df99820df8e586b6df8baae2b91a782d': 'INSTAPOOL-C',
  '0x43b5343075699159638432395df731dfaf3e0e64': 'INTEROP-A',
  '0x04e44ec963dbdc369ccb45bb43a423ceca2b222c': 'INTEROP-STAGING-A',
  // '0x888d85fe4eafe3d462f11faa1b22c0d860be8f3f': 'PARASWAP-A',
  '0x888d85fe4eafe3d462f11faa1b22c0d860be8f3f': 'PARASWAP-V5-A',
  '0xd7a7296623c56f884b0a753ebd6653911f3986ca': 'UNIVERSE-A',
  // '0x4354e07ef8a68e5c24b343e74b2574cbdd05ec81': 'ZEROX-A',
  '0x4354e07ef8a68e5c24b343e74b2574cbdd05ec81': 'ZEROX-V4-A',
  '0x90d45f987bcad6dd7fb5fe0994124d455cf30bca': 'SUSHISWAP-A',
  '0x8ec066d75d665616a94f2eccdbe49b54eaeefc78': 'UBIQUITY-A',
  '0x6ea1fb0bd094b926f37b22fe5846e7a0f8378b42': 'UNISWAP-V3-STAKER-B',
  '0xd6fdf729ebfb44658d1e2f4abe32d5818bc432f3': 'MSTABLE-A',
  '0x54c624734f6f6b23e1c59fb0b2c3d0822c5a7135': 'UNISWAP-V3-ROUTER-A',
  '0x0a867e42f73f60fafa8d6802be558f771a6df3c0': 'LIDO-STETH-A',
  '0x3595d71b4d96a155ef08f0b7643384751aded9f4': 'COMPOUND-IMPORT-D',
  '0x3e5b9003e1674e15aa6a201b7b353c872c1ea791': 'LITE-A',
  '0x0b7675e19d71a0c8953444f7f9913b8448186441': 'NOTIONAL-V2-A',
  '0x76b8c2defcd256b535570657e51c0c7760a78987': 'HOP-MAINNET-A',
  '0xdd6f1a8036f8f65a6f53f1818f928d4153a8dad3': 'UNISWAP-V3-SWAP-A',
  '0x2249afe319baa0137cb434116ac4d4fd5c3eb719': 'DSA-SPELL-A',
  '0xe6aa2d277aafbb9e19354f6f893737c3608ff995': 'SWAP-AGGREGATOR-A',
  '0x6fa88564ed767b38d029c91a56f62e80886a526c': 'INSTA-DEX-SIMULATION-A',
  '0xbb5d0041e9e1f96a7d35f4f60ba9a43596b865aa': 'EULER-A',
  '0x3860ab3e6dbb46a267cbee72d5fb81ca07ff6daf': 'EULER-IMPORT-A',
  '0x81fadcd5ed91997112570b56bd2615e1d177ecd3': 'EULER-REWARDS-A',
  '0xfe5035e509eb1ff98f32828f947d64ec2980df71': 'AAVE-V2-AUTOMATION-STAGING-A',
  '0x724b1e5dbc51309b69513a2716c8659051175eb8': 'AAVE-V2-AUTOMATION-A',
  '0x5c31e2d1c611d062befdf3883ade05a32c52b9cb': 'COMPOUND-V3-A',
  '0xa1040eaab1d5ba731aad6d9b59c70e1e1a5bed57': 'WSTETH-A',
  '0x44ac5ed26d8b7bbcf3bcb9ac486191cbb294b140': 'COMPOUND-V3-REWARDS-A',
  '0xee7afecd937a7a133e421719d790563f871410e7': 'LITE-B',
  '0x6b9f48e719aca05cb087a739253ba3168d47447e': 'MORPHO-AAVE-V2-A',
  '0x1b5687b3132a88120cf41b58d6d454a6015ea0a2': 'MORPHO-AAVE-V3-A',
  '0xba2d32ce0ff26bee767b4fb22f5ad0a10a7cfabb': 'MORPHO-COMPOUND-V2-A',
  '0x43416b914a9f66c46ff0dd9ca05bc297989f8f7e': 'MORPHO-REWARDS-A',
  '0x2360ac6c1f061c5a5af797fd195ba6b00b3d48ee': 'AVO-APPROVE-A',
  '0x3b46e32d158db274769601ff9fa306a2c7dfcdd0': 'AVO-APPROVE-STAGING-A',
  '0xb914f104dbbd43bc71be3caad97f9bd6f256e67d': 'AVO-MAKER-A',
  '0x0ac1eab0fbe7d57881c4c9626ed493e5809cbdd9': 'AVO-MAKER-STAGING-A',
  '0xdf1b85edbbd6dc34713dff3c0400ad08292d1b70': 'CONNEXT-A',
  '0xcfb46dbf4535f6c72bdfaf9fb8e7130fa03e24bc': 'SPARK-A',
  '0x8e2bfe61abc48435283be78ca0fe053b1bf24e69': 'KYBER-AGGREGATOR-A',
  '0x389657de20592a0f5ad9eb4de44fe8293616b751': 'BASIC-D',
  '0x62750cfebdb196cae6dd6956c13ad60682a614d0': 'AVO-APPROVE-MULTISIG-A',
  '0xf61617c863c58f864083377a446e051668dbdc51': 'AVO-APPROVE-MULTISIG-STAGING-A'
}

const avocadoConnectorsAddressToName : Record<Network, Record<Lowercase<string>, string>> = {
  mainnet: {
    '0xbdba11d5a89ed8ca542f801f785270c1d773b3f0': 'aave-v2-import-c',
    '0x1852c8b7fd63d8d8749ca8dbd98d9fad9ccc7ac7': 'aave-v3-import-a',
    '0xfcc6de9477dfcab473021f4743fa0ec5cec73417': 'compound-import-d',
    '0x1df3c8ac7ba672f060dbc088352965db862f98d8': 'euler-import-a',
    '0x20f2ad8531c7af639659b867518e15fe57550bba': 'aave-v3-import-permit-a'
  },
  polygon: {
    '0x5f337be2294fe4244e61177508ea9314851998a0': 'aave-v2-import-c',
    '0x6f836b972129a525615452b1bd80a0f4ecf94fed': 'aave-v3-import-a',
    '0xa3770b566c8c14b3191ed46c3e1be1b2d153cffc': 'aave-v3-import-permit-a'
  },
  arbitrum: {
    '0x6773ee66207b2322053c399c670973c63aa80bfc': 'aave-v3-import-a',
    '0xfc563b347874a4a456dd389f9de56fbe55e6e196': 'aave-v3-import-permit-a'
  },
  avalanche: {
    '0xf0f037538b583f1b61288343d208218f90c30029': 'aave-v2-import-c',
    '0xa066bd18446cb56c020623784a1b86a69d6da45d': 'aave-v3-import-a',
    '0x67a3c4df395c01cfb107ed9447242c136d1523a6': 'aave-v3-import-permit-a'
  },
  gnosis: {
    '0x0030d79af00325a5b4577a7d5976492a93db114b': 'aave-v3-import-a',
    '0x1814d6e8e85bd58c6fccc9bdf82a6d1931a825bd': 'aave-v3-import-permit-a'
  }
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

const connectorAddressToName = (connectorAddressOrName: string, network: Network) => {
  if (!isAddress(connectorAddressOrName)) {
    return connectorAddressOrName
  }
  const address = connectorAddressOrName.toLowerCase()

  return connectorsV2AddressToName[address] || connectorsV1AddressToName[address] || avocadoConnectorsAddressToName[network][address] || address
}

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
      connector: connectorAddressToName(connectorName, network),
      data,
      method: null,
      args: [],
      namedArgs: {},
      flashloanSpells: undefined,
      isAvocadoFlashloan: false
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

    if (spell.connector === 'INSTAPOOL-C' && ['flashBorrowAndCast', 'flashMultiBorrowAndCast'].includes(spell.method)) {
      try {
        const [targets, spells] = defaultAbiCoder.decode(['string[]', 'bytes[]'], (spell.namedArgs as any).data)
        spell.flashloanSpells = await this.getSpells({
          targets,
          spells
        }, network, metadata)
      } catch (error) {
        try {
          const [actions] = defaultAbiCoder.decode(['(address target, bytes data, uint256 value, uint256 operation)[]'], (spell.namedArgs as any).data)
          const targets = []
          const spells = []
          for (let index = 0; index < actions.length; index++) {
            const action = actions[index]

            if (action.target.toLowerCase() === '0x60d0DfAa7D6389C7a90C8FD2efAbB3162047adcd'.toLowerCase() && action.data.startsWith('0xc4cf3764')) {
              const decodedData = defaultAbiCoder.decode(['address[]', 'uint256[]'], `0x${data.slice(10)}`)

              const params = [
                ...decodedData,
                Array(decodedData[0].length).fill('0'),
                Array(decodedData[0].length).fill('0')
              ]

              const encodedData = defaultAbiCoder.encode(['address[]', 'uint256[]', 'uint256[]', 'uint256[]'], params)
              const encodedFunctionData = `0xf13fa6be${encodedData.slice(2)}`

              spells.push(encodedFunctionData)
              targets.push('INSTAPOOL-C')
            } else {
              spells.push(action.data)
              targets.push(connectorAddressToName(action.target, network))
            }
          }

          spell.flashloanSpells = await this.getSpells({
            targets,
            spells
          }, network, metadata)

          spell.isAvocadoFlashloan = true
        } catch (error) {
        }
      }
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
