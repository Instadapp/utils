import { describe, test, expect } from 'vitest'
import { Blockscan, Chain } from '../src'

const etherscan = new Blockscan(Chain.Mainnet, process.env.MAINNET_ETHERSCAN_API_KEY)

describe.concurrent('blockscan', () => {
  test('custom', async () => {
    const scan = Blockscan.custom(
      'https://basescan.org',
      'https://api.basescan.org/api',
      process.env.MAINNET_ETHERSCAN_API_KEY
    )

    const source = await scan.contractSourceCode('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')

    expect(source).toBeDefined()
  })

  test('getSourceCode', async () => {
    const source = await etherscan.contractSourceCode('0x06012c8cf97bead5deae237070f9587f8e7a266d')

    expect(source).toBeDefined()
  })

  test('getTransactions', async () => {
    const transactions = await etherscan.getTransactions('0x910E413DBF3F6276Fe8213fF656726bDc142E08E', {
      startblock: 15436458,
      endblock: 15536458
    })

    expect(transactions).toHaveLength(15)
  })

  test('getInternalTransactions', async () => {
    const transactions = await etherscan.getInternalTransactions('0x910E413DBF3F6276Fe8213fF656726bDc142E08E', {
      startblock: 15436466,
      endblock: 16536466
    })

    expect(transactions).toHaveLength(3)
  })

  test('getErc20TokenTransferEvents', async () => {
    const events = await etherscan.getErc20TokenTransferEvents({
      address: '0x910E413DBF3F6276Fe8213fF656726bDc142E08E'
    }, {
      startblock: 15436466,
      endblock: 16536466
    })

    expect(events).toHaveLength(20)
  })

  test('getErc721TokenTransferEvents', async () => {
    const events = await etherscan.getErc721TokenTransferEvents({
      address: '0x6975be450864c02b4613023c2152ee0743572325'
    }, {
      startblock: 4708120,
      endblock: 4808120
    })

    expect(events).toHaveLength(155)
  })

  test('getErc1155TokenTransferEvents', async () => {
    const events = await etherscan.getErc1155TokenTransferEvents({
      address: '0x910E413DBF3F6276Fe8213fF656726bDc142E08E'
    }, {
      startblock: 16407799,
      endblock: 18407799
    })

    expect(events).toHaveLength(1)
  })
}, {
  retry: 3
})
