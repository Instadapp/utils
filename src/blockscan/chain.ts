export enum Chain {
  Custom = -1,
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
  Sepolia = 1397,
  Polygon = 137,
  PolygonMumbai = 80001,
  Avalanche = 43114,
  Optimism = 10,
  Arbitrum = 42161,
  Gnosis = 100,
  BSC = 56,
  PolygonZkEVM = 1101,
  Fantom = 250,
  Base = 8453,
  Scroll = 534352,
}

export function getChainScanUrls (chain: Chain | number): { base: string, api: string } {
  switch (chain) {
    case Chain.Mainnet:
      return {
        base: 'https://etherscan.io',
        api: 'https://api.etherscan.io/api'
      }
    case Chain.Ropsten:
      return {
        base: 'https://ropsten.etherscan.io',
        api: 'https://api-ropsten.etherscan.io/api'
      }
    case Chain.Kovan:
      return {
        base: 'https://kovan.etherscan.io',
        api: 'https://api-kovan.etherscan.io/api'
      }
    case Chain.Rinkeby:
      return {
        base: 'https://rinkeby.etherscan.io',
        api: 'https://api-rinkeby.etherscan.io/api'
      }
    case Chain.Goerli:
      return {
        base: 'https://goerli.etherscan.io',
        api: 'https://api-goerli.etherscan.io/api'
      }
    case Chain.Sepolia:
      return {
        base: 'https://sepolia.etherscan.io',
        api: 'https://api-sepolia.etherscan.io/api'
      }
    case Chain.Polygon:
      return {
        base: 'https://polygonscan.com',
        api: 'https://api.polygonscan.com/api'
      }
    case Chain.PolygonMumbai:
      return {
        base: 'https://mumbai.polygonscan.com',
        api: 'https://api-testnet.polygonscan.com/api'
      }
    case Chain.Avalanche:
      return {
        base: 'https://snowtrace.io',
        api: 'https://api.snowtrace.io/api'
      }
    case Chain.Optimism:
      return {
        base: 'https://optimistic.etherscan.io',
        api: 'https://api-optimistic.etherscan.io/api'
      }
    case Chain.Arbitrum:
      return {
        base: 'https://arbiscan.io',
        api: 'https://api.arbiscan.io/api'
      }
    case Chain.Gnosis:
      return {
        base: 'https://gnosisscan.io',
        api: 'https://api.gnosisscan.io/api'
      }
    case Chain.BSC:
      return {
        base: 'https://bscscan.com',
        api: 'https://api.bscscan.com/api'
      }
    case Chain.PolygonZkEVM:
      return {
        base: 'https://zkevm.polygonscan.com',
        api: 'https://api-zkevm.polygonscan.com/api'
      }
    case Chain.Fantom:
      return {
        base: 'https://ftmscan.com',
        api: 'https://api.ftmscan.com/api'
      }
    case Chain.Base:
      return {
        base: 'https://basescan.org',
        api: 'https://api.basescan.org/api'
      }
    case Chain.Scroll:
      return {
        base: 'https://scrollscan.org',
        api: 'https://api.scrollscan.org/api'
      }
    default:
      throw new Error(`Unsupported chain ${chain}`)
  }
}
