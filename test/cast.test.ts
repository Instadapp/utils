import { expect, describe, test, beforeAll } from 'vitest'
import NodeCache from 'node-cache'
import DSA from 'dsa-connect'
import Web3 from 'web3'
import { AbiFetcher, CastDecoder } from '../src'

const defaultAbiCache = new NodeCache()

const defaultAbiFetcher = new AbiFetcher({
  retries: 2,
  cache: {
    get (key) {
      return defaultAbiCache.get(key)
    },
    set (key, value) {
      return defaultAbiCache.set(key, value, 60)
    }
  },
  etherscanApiKey: {
    mainnet: process.env.MAINNET_ETHERSCAN_API_KEY,
    polygon: process.env.POLYGON_ETHERSCAN_API_KEY,
    avalanche: process.env.AVLANCHE_ETHERSCAN_API_KEY,
    arbitrum: process.env.ARBITRUM_ETHERSCAN_API_KEY,
    optimism: process.env.OPTIMISM_ETHERSCAN_API_KEY,
    fantom: process.env.FANTOM_ETHERSCAN_API_KEY
  }
})

const castDecoder = new CastDecoder({
  abiFetcher: defaultAbiFetcher
})

const dsa = new DSA(new Web3('https://rpc.ankr.com/eth'))

beforeAll(async () => {
  await dsa.setInstance(21723)
})

describe('cast', () => {
  test('can get encoded spells from encoded data', () => {
    const spells = dsa.Spell()

    const token = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    const amount = Web3.utils.toWei('0.002', 'ether')

    spells.add({
      connector: 'AAVE-V2-A',
      method: 'deposit',
      args: [token, amount, 0, 0]
    })

    const encodedData = dsa.encodeCastABI(spells)

    const encodedSpells = castDecoder.getEncodedSpells(encodedData)

    expect(encodedSpells).toEqual(dsa.encodeSpells(spells))
  })

  test('can get spells from encoded data', async () => {
    const spells = dsa.Spell()

    const token = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    const amount = Web3.utils.toWei('0.002', 'ether')

    spells.add({
      connector: 'AAVE-V2-A',
      method: 'deposit',
      args: [token, amount, 0, 0]
    })

    const encodedSpells = dsa.encodeSpells(spells)
    const encodedData = dsa.encodeCastABI(spells)

    const decodedSpells = await castDecoder.getSpells(encodedData, 'mainnet')

    const expectedDecodedSpell =
    {
      connector: 'AAVE-V2-A',
      data: encodedSpells.spells[0],
      method: 'deposit',
      args: [token, amount, '0', '0'],
      namedArgs: {
        amt: amount,
        getId: '0',
        setId: '0',
        token
      }
    }

    expect(decodedSpells).toEqual([expectedDecodedSpell])
  })

  test('can decode single spell', async () => {
    const spells = dsa.Spell()

    const token = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    const amount = Web3.utils.toWei('0.002', 'ether')

    spells.add({
      connector: 'AAVE-V2-A',
      method: 'deposit',
      args: [token, amount, 0, 0]
    })

    const encodedSpells = dsa.encodeSpells(spells)

    const decodedSpell = await castDecoder.getSpell('AAVE-V2-A', encodedSpells.spells[0], 'mainnet')

    const expectedDecodedSpell =
    {
      connector: 'AAVE-V2-A',
      data: encodedSpells.spells[0],
      method: 'deposit',
      args: [token, amount, '0', '0'],
      namedArgs: {
        amt: amount,
        getId: '0',
        setId: '0',
        token
      }
    }

    expect(decodedSpell).toEqual(expectedDecodedSpell)
  })

  test('can get spells from struct', async () => {
    const spells = dsa.Spell()

    const token = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    const amount = Web3.utils.toWei('0.002', 'ether')

    spells.add({
      connector: 'AAVE-V2-A',
      method: 'deposit',
      args: [token, amount, 0, 0]
    })

    const encodedSpells = dsa.encodeSpells(spells)

    const decodedSpells = await castDecoder.getSpells(encodedSpells as any, 'mainnet')

    const expectedDecodedSpell =
    {
      connector: 'AAVE-V2-A',
      data: encodedSpells.spells[0],
      method: 'deposit',
      args: [token, amount, '0', '0'],
      namedArgs: {
        amt: amount,
        getId: '0',
        setId: '0',
        token
      }
    }

    expect(decodedSpells).toEqual([expectedDecodedSpell])
  })
})
