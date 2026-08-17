'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bscTestnet, zkSync } from '@reown/appkit/networks'
import { createStorage } from 'wagmi'
import { getFomoAdminIconUrl } from './fomoAdminIcon'
import { ZKSYNC_CAIP_NETWORK_ID } from './zksync'

export const projectId = '29b03a4884468292ab50e189f5bc031d'

const appKitNetworkStorageKeys = [
  '@appkit/active_caip_network_id',
  '@appkit/active_namespace',
  '@appkit/connected_namespaces',
  '@appkit/connection_status',
  '@appkit/connections',
  '@appkit/disconnected_connector_ids',
  '@appkit/eip155:connected_connector_id',
]

const browserStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  },
}

const resetStaleAppKitNetworkState = () => {
  if (typeof window === 'undefined') return

  const activeNetworkId = window.localStorage.getItem('@appkit/active_caip_network_id')

  const allowedNetworkIds = new Set([ZKSYNC_CAIP_NETWORK_ID, `eip155:${bscTestnet.id}`])

  if (activeNetworkId && !allowedNetworkIds.has(activeNetworkId)) {
    appKitNetworkStorageKeys.forEach((key) => {
      window.localStorage.removeItem(key)
    })
  }
}

resetStaleAppKitNetworkState()

const storage = createStorage({
  key: 'fomo-zksync-wagmi',
  storage: browserStorage,
})

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [zkSync, bscTestnet],
  storage,
  ssr: false
})

const metadata = {
  name: 'FOMO',
  description: 'All crypto in one place',
  url: 'https://fomo.cx',
  icons: [getFomoAdminIconUrl()]
}

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,

  networks: [zkSync, bscTestnet],
  defaultNetwork: zkSync,

  metadata,

  features: {
    email: false,
    socials: [],
    emailShowWallets: true
  },

  allWallets: 'SHOW'
})
