import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index'
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true
  },
  externals: ['@ethersproject/abi'],
  clean: true,
  declaration: true
})
