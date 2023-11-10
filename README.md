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
yarn add @instadapp/utils

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

const abiCache = new NodeCache();

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
    mainnet: "9D13ZE7XSBTJ94N9BNJ2MA33VMAY2YPIRB",
  },
});

await abiFetcher.get("0xB8c77482e45F1F44dE1745F52C74426C631bDD52", "mainnet");
```

### CastDecoder

basic setup :

```js
import { CastDecoder } from "@instadapp/utils";

const castDecoder = new CastDecoder();

// using cast data
await castDecoder.getSpells(
  "0x9304c934000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000009414156452d56322d410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000084ce88b439000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000071afd498d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "mainnet"
);

// using encodedSpells
await castDecoder.getSpells(
  {
    targets: ["AAVE-V2-A"],
    spells: [
      "0xce88b439000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000071afd498d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    ],
  },
  "mainnet"
);

// decode one encoded spell
await castDecoder.getSpell(
  "AAVE-V2-A",
  "0xce88b439000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000071afd498d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "mainnet"
);
```

### retry

```js
import { retry } from "@instadapp/utils";

retry(() => asyncCall(), {
  timeouts: [5_000, 10_000, 15_000], // timeouts for each retry attempt in ms
  delay: 300, // delay between retries in ms
});
```

### wait

```js
import { wait } from "@instadapp/utils";

await wait(300);
```

### promiseTimeout

```js
import { promiseTimeout } from "@instadapp/utils";

await promiseTimeout(promiseFn, 10_000);
```

### JsonRpcRetryProvider

```js
import { JsonRpcRetryProvider } from "@instadapp/utils";

const provider = new JsonRpcRetryProvider("https://rpc.ankr.io/eth");

const providerWithCustomOptions = new JsonRpcRetryProvider(
  "https://rpc.ankr.io/eth",
  {
    timeouts: [5_000, 10_000, 15_000], // timeouts for each retry attempt in ms
    delay: 300, // delay between retries in ms
  }
);
```

```ts
import { JsonRpcRetryProvider } from "@instadapp/utils";

const provider = new JsonRpcRetryProvider([
  "https://rpc.ankr.com/invalid",
  "https://rpc.ankr.com/invalid-2",
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
]);
```

### JsonRpcRetryBatchProvider

```js
import { JsonRpcRetryBatchProvider } from "@instadapp/utils";

const provider = new JsonRpcRetryBatchProvider("https://rpc.ankr.io/eth");

const providerWithCustomOptions = new JsonRpcRetryBatchProvider(
  "https://rpc.ankr.io/eth",
  {
    timeouts: [5_000, 10_000, 15_000], // timeouts for each retry attempt in ms
    delay: 300, // delay between retries in ms
  }
);
```

### StaticJsonRpcRetryProvider

```js
import { StaticJsonRpcRetryProvider } from "@instadapp/utils";

const provider = new StaticJsonRpcRetryProvider("https://rpc.ankr.io/eth");

const providerWithCustomOptions = new StaticJsonRpcRetryProvider(
  "https://rpc.ankr.io/eth",
  {
    timeouts: [5_000, 10_000, 15_000], // timeouts for each retry attempt in ms
    delay: 300, // delay between retries in ms
  }
);
```

### Cache

```ts
import { Cache, ICacheDriver } from "@instadapp/utils";

Cache.extend("mongodb", {
  async get(key: string) {},
  async set(key: string, value: any, seconds?: number) {},
  async forget(key: string) {},
  async flush() {},
  // optional, and experimental
  lock(key: string, seconds: number) {
    return {
      async acquire() {
        return true;
      },
      async release() {},
    };
  },
});

// Note: you should set this once per life cycle
Cache.setDefault("mongodb"); // default is `memory` https://github.com/Instadapp/utils/tree/master/src/cache/drivers/index.ts

await Cache.get("key1");
await Cache.get("key1", "default");
await Cache.get("key1", async () => "default");

await Cache.put("key2");
await Cache.put("key2", "default");
await Cache.put("key2", async () => "default");

const seconds = 42;

await Cache.put("key2", "default");
await Cache.put("key2", "default", seconds);
await Cache.put("key2", async () => "default", seconds);

await Cache.pull("key3"); // get and forget
await Cache.forget("key1");
await Cache.flush();

const users = await Cache.remember("users", seconds, async () => {
  return await User.find();
});

await Cache.store("memory").get("users:1"); // safe way to switch driver for a moment

// experimental
const isLocked = await Cache.lock("key").get(async () => {
  console.log("do something");
});

// or
const isAcquired = await Cache.getLock("key", async () => {
  console.log("do something");
});

// or
const lock = Cache.lock("key");

if (await lock.get()) {
  console.log("do something");

  await lock.release();
}

// or
const lock = Cache.lock("key");

try {
  await lock.block(5);
  // Lock acquired after waiting a maximum of 5 seconds...
} catch {
  // Unable to acquire lock...
} finally {
  await lock.release();
}

// or
await Cache.block("key", 5, async () => {
  // Lock acquired after waiting a maximum of 5 seconds...
});
```

### toJsonRpcProvider

```ts
import { toJsonRpcProvider } from "@instadapp/utils";
import { ethers } from "ethers";

let provider = toJsonRpcProvider(window.ethereum); // Metamask, Rabby, ...
let provider = toJsonRpcProvider(web3); // Web3.js instance, `web3.currentProvider` will be used internally
let provider = toJsonRpcProvider(web3.currentProvider); // Web3.js provider, ex:  Metamask, Rabby, WalletConnect, ...
let provider = toJsonRpcProvider("https://rpc.ankr.com/eth"); // Http RPC URL
let provider = toJsonRpcProvider(
  new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth")
); // ethers JsonRpcProvider instance
```

### Blockscan

```ts
import { Blockscan, Chain } from "@instadapp/utils";

const etherscan = new Blockscan(Chain.Mainnet);

await etherscan.getTransactions("0x6975be450864c02b4613023c2152ee0743572325");
await etherscan.getInternalTransactions(
  "0x6975be450864c02b4613023c2152ee0743572325"
);
await etherscan.getErc20TokenTransferEvents(
  "0x6975be450864c02b4613023c2152ee0743572325"
);
await etherscan.getErc721TokenTransferEvents(
  "0x6975be450864c02b4613023c2152ee0743572325"
);
await etherscan.getErc1155TokenTransferEvents(
  "0x6975be450864c02b4613023c2152ee0743572325"
);

const basescan = Blockscan.custom(
  "https://basescan.org",
  "https://api.basescan.org/api"
);
await basescan.contractSourceCode("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
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
