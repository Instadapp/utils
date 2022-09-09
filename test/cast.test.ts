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

  test('can get flash spells', async () => {
    const flashCastData = '0x9304c934000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000003d70891b8994feb6cca7022b25c32be92ee372500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b494e535441504f4f4c2d430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000019644cb38df5000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000019400000000000000000000000000000000000000000000000000000000000001880000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000a31494e43482d56342d41000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009414156452d56322d4100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009414156452d56322d410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b494e535441504f4f4c2d43000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000001420000000000000000000000000000000000000000000000000000000000000150000000000000000000000000000000000000000000000000000000000000015c00000000000000000000000000000000000000000000000000000000000001364f892b2ad0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000036f1ab0eebc3ade2e100000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000f371a3f0300000000000000000000000000000000000000000000000000000000000012687c025200000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000180000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d4000000000000000000000000d8af19cec55374cf424f98effe9c40fd45128ad10000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000155a31d7673392db9a9f00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010c00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000260000000000000000000000000000000000000000000000000000000000000052000000000000000000000000000000000000000000000000000000000000007e00000000000000000000000000000000000000000000000000000000000000ba00000000000000000000000000000000000000000000000000000000000000e8000000000000000000000000060594a405d53811d3bc4766596efd80fd545a270000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000104128acb08000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a688906bd8b00000000000000000000000000000fffd8963efd1fc6a506488495d951d5263988d2500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000022414284aab00000000000000000000000000000000000000000000000000000000000000808000000000000000000000000000000000000000000000000000000000000044000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000005a000000000000000000000000000001b8800000000000000000000000c2e9f25be6257c210d7adf0d4cd6e3e881ba25f8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000104128acb08000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000fffd8963efd1fc6a506488495d951d5263988d2500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000022414284aab00000000000000000000000000000000000000000000000000000000000000808000000000000000000000000000000000000000000000000000000000000044000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000015e0000000000000000000000000000015e8000000000000000000000008ad599c3a0ff1de082011efddc58f1908eb6e6d8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000104128acb08000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000fffd8963efd1fc6a506488495d951d5263988d2500000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000324ad0e7b1a000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000032000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001408000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064eb5625d9000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000a59649758aa4d66e25f08dd01271e891fe5219900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000080000000000000000000000089b78cfa322f6c5de0abceecab66aee45393cc5a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004495991276000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000044800000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000024432ce0a7c00000000000000000000000000000000000000000000000000000000000000808000000000000000000000000000000000000000000000000000000000000044000000000000000000000000220bda5c8994804ac96ebe4df184d25e5c2196d400000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a4059712240000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000b1dc62ec38e6e3857a887210c38418e4a17da5b20000000000000000000000000000000000000000000000000000000000000001000000000000000002c2bcff17afe45a00000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000454ebe83a0f3425e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004470bdb9470000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000159168a5dc9b876975660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000016414284aab000000000000000000000000000000000000000000000000000000000000008080000000000000000000000000000000000000000000000000000000000000240000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000001000000000000000000000000000000010000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044a9059cbb0000000000000000000000001111111254fb6c44bac0bed2854e76f90643097d00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a78de0a20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a44e5e60e70000000000000000000000006b175474e89094c44da98b954eedeac495271d0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000f371a3f0300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000844532d776000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000056c7900e991d5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084213980e8000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000056c7900e991d500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

    const decodedSpells = await castDecoder.getSpells(flashCastData, 'mainnet')

    expect(decodedSpells[0].flashloanSpells).toBeDefined()
  })

  test('can decode connector event', async () => {
    const args = await castDecoder.getEventNamedArgs(
      'BASIC-A',
      'LogWithdraw(address,uint256,address,uint256,uint256)',
      '0x00000000000000000000000003ab458634910aad20ef5f1c8ee96f1d6ac549190000000000000000000000000000000000000000000000006d0a3d530cf3fda2000000000000000000000000fd9a6cd1670fe8eb4012d8abb9cdf25741a6ff0400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      'mainnet'
    )

    expect(args).toEqual({
      getId: '0',
      setId: '0',
      tokenAmt: '7857159926810148258',
      to: '0xFD9A6cD1670FE8eB4012d8ABb9Cdf25741A6Ff04',
      erc20: '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919'
    })
  })

  test('can decode dsa v1 spells', async () => {
    const input = '0xe0e90acf000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000003d70891b8994feb6cca7022b25c32be92ee3725000000000000000000000000000000000000000000000000000000000000000100000000000000000000000094dfafcc80b8460acf1cbc5cac17bd83c95e99920000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c47008dc750000000000000000000000000000000000000000000000000000000000000080ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055a52582d4100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

    const spells = await castDecoder.getSpells(input, 'mainnet')

    const expectedDecodedSpell =
    {
      connector: 'compound',
      data: '0x7008dc750000000000000000000000000000000000000000000000000000000000000080ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055a52582d41000000000000000000000000000000000000000000000000000000',
      method: 'withdraw',
      args: [
        'ZRX-A',
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        '0',
        '0'
      ],
      namedArgs: {
        tokenId: 'ZRX-A',
        amt: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        getId: '0',
        setId: '0'
      }
    }

    expect(spells).toEqual([expectedDecodedSpell])
  })

  test('get spells at a given block', async () => {
    const abi1 = await castDecoder.getConnectorAbi(
      'EULER-A',
      'mainnet',
      {
        blockNumber: 15326656
      }
    )

    expect(abi1.length).equal(27)

    const abi2 = await castDecoder.getConnectorAbi(
      'EULER-A',
      'mainnet',
      {
        blockNumber: 15416934
      }
    )

    expect(abi2.length).equal(25)
  })

  test('can get multi flash spells', async () => {
    const flashCastData = '0x9304c934000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b494e535441504f4f4c2d4300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000092440aa3b2c00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000090000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000002d79883d200000000000000000000000000000000000000000000000000000000000000186a00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000009414156452d56322d4100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009414156452d56322d410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a434f4d504f554e442d4100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b494e535441504f4f4c2d430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000034000000000000000000000000000000000000000000000000000000000000000a44e5e60e70000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000002d79883d20000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a44e5e60e70000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000186a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4cdcb4b29000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000002d7f5a5ada000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000054441492d41000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000204f13fa6be000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000002d7f5a5ada00000000000000000000000000000000000000000000000000016372f1e5c7200000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

    const decodedSpells = await castDecoder.getSpells(flashCastData, 'mainnet')

    expect(decodedSpells[0].args[0]).toEqual([
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    ])

    expect(decodedSpells[0].args[1]).toEqual([
      '50000000000000',
      '100000'
    ])
  })
})
