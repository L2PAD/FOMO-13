export const ZKSYNC_CHAIN_ID = 324
export const ZKSYNC_CHAIN_ID_HEX = '0x144'
export const ZKSYNC_CAIP_NETWORK_ID = `eip155:${ZKSYNC_CHAIN_ID}`

export const ZKSYNC_ADD_ETHEREUM_CHAIN_PARAMETER = {
  chainId: ZKSYNC_CHAIN_ID_HEX,
  chainName: 'ZKsync Era',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: ['https://mainnet.era.zksync.io'],
  blockExplorerUrls: ['https://explorer.zksync.io/'],
}
