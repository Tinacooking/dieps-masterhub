/**
 * DIEPS Intent Engine — Token Constants
 * This file defines the strictly verified on-chain tokens for Sui Mainnet.
 * These addresses and decimals are fetched directly from the Sui RPC.
 */



export interface WhitelistToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isStable: boolean;

  aliases: string[];
}

export const TOKEN_WHITELIST: WhitelistToken[] = [
  {
    symbol: 'SUI',
    name: 'Sui',
    address: '0x2::sui::SUI',
    decimals: 9,
    isStable: false,

    aliases: ['sui', 'SUI'],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    decimals: 6,
    isStable: true,

    aliases: ['usdc', 'usd coin', 'dollar'],
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    decimals: 6,
    isStable: true,

    aliases: ['usdt', 'tether'],
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    decimals: 8,
    isStable: false,

    aliases: ['eth', 'weth', 'ether', 'ethereum'],
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    decimals: 8,
    isStable: false,

    aliases: ['btc', 'wbtc', 'bitcoin'],
  },
  {
    symbol: 'CETUS',
    name: 'Cetus Protocol',
    address: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    decimals: 9,
    isStable: false,
    aliases: ['cetus'],
  },
  {
    symbol: 'TURBOS',
    name: 'Turbos Finance',
    address: '0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS',
    decimals: 9,
    isStable: false,
    aliases: ['turbos'],
  },
  {
    symbol: 'SCA',
    name: 'Scallop',
    address: '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
    decimals: 9,
    isStable: false,
    aliases: ['sca', 'scallop'],
  },
  {
    symbol: 'NAVX',
    name: 'NAVI Protocol',
    address: '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX',
    decimals: 9,
    isStable: false,
    aliases: ['navx', 'navi'],
  },
  {
    symbol: 'BUCK',
    name: 'Bucket Protocol',
    address: '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK',
    decimals: 9,
    isStable: true,
    aliases: ['buck', 'bucket'],
  },
  {
    symbol: 'FUD',
    name: 'FUD the Pug',
    address: '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD',
    decimals: 5,
    isStable: false,
    aliases: ['fud'],
  },
  {
    symbol: 'DEEP',
    name: 'DeepBook',
    address: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    decimals: 6,
    isStable: false,
    aliases: ['deep', 'deepbook'],
  },
  {
    symbol: 'BLUB',
    name: 'BLUB',
    address: '0xfa7ac3951fdca12c1f7ef8b8a1dbb0c76e3c52b53e98931e00f29d3e3e2e3b5a::blub::BLUB',
    decimals: 2,
    isStable: false,
    aliases: ['blub'],
  },
  {
    symbol: 'AUSD',
    name: 'Argo USD',
    address: '0x2053d08c1e2bd02791056171aab0fd12bd7cd10bf5c6dfb4e17abbc55b1b23da::ausd::AUSD',
    decimals: 6,
    isStable: true,
    aliases: ['ausd', 'argo'],
  },
];
