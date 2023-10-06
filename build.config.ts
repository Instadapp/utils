import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index'
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true
  },
  externals: [
    '@ethersproject/abi',
    '@ethersproject/providers',
    '@ethersproject/properties',
    '@ethersproject/networks',
    '@ethersproject/bytes',
    '@ethersproject/web',
    '@ethersproject/transactions',
    '@ethersproject/hash',
    '@ethersproject/abstract-provider',
    '@ethersproject/abstract-signer',
    '@ethersproject/bignumber',
    '@ethersproject/strings',
    '@ethersproject/logger',
    '@ethersproject/contracts',
    '@ethersproject/address'
  ],
  clean: true,
  declaration: true
})
