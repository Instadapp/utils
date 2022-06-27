# @instadapp/utils

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Instadapp Utils

## Usage

Install package:

```sh
# npm
npm install @instadapp/utils

# yarn
yarn install @instadapp/utils

# pnpm
pnpm install @instadapp/utils
```

Import:

```js
// ESM
import {} from "@instadapp/utils";

// CommonJS
const {} = require("@instadapp/utils");
```

## Examples

### AbiFetcher

basic setup :

```js
import { AbiFetcher } from "@instadapp/utils";

const abiFetcher = new AbiFetcher();

await abiFetcher.get("0x0000000000000000000000000000000000001010", "polygon");
```
with caching:

```js
import { AbiFetcher } from "@instadapp/utils";
import NodeCache from "node-cache";
 
const abiCache = new NodeCache()

const abiFetcher = new AbiFetcher({
  cache: {
    get(key) {
      return abiCache.get(key);
    },
    set(key, value) {
      return abiCache.set(key, value, 10);
    },
  },
});

await abiFetcher.get("0x0000000000000000000000000000000000001010", "polygon");
```
with etherscan api keys (recommended)
```js
import { AbiFetcher } from "@instadapp/utils";

const abiFetcher = new AbiFetcher({
   etherscanApiKey: {
      mainnet: '9D13ZE7XSBTJ94N9BNJ2MA33VMAY2YPIRB'
    }
})

await abiFetcher.get('0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 'mainnet')
```

## 💻 Development

- Clone this repository
- Install dependencies using `yarn install`
- Run interactive tests using `yarn dev`

## License

Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@instadapp/utils?style=flat-square
[npm-version-href]: https://npmjs.com/package/@instadapp/utils
[npm-downloads-src]: https://img.shields.io/npm/dm/@instadapp/utils?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@instadapp/utils
[github-actions-src]: https://img.shields.io/github/workflow/status/instadapp/utils/ci/main?style=flat-square
[github-actions-href]: https://github.com/instadapp/utils/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/instadapp/utils/main?style=flat-square
[codecov-href]: https://codecov.io/gh/instadapp/utils
