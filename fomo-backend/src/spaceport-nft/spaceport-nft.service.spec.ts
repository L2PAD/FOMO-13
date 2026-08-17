import { SpaceportNftService } from './spaceport-nft.service';

describe('SpaceportNftService deployment configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SPACEPORT_RPC_URL;
    delete process.env.FOMO_V2_LAUNCHPAD_RPC_URL;
    delete process.env.BSC_TESTNET_RPC_URL;
    delete process.env.WEB3_RPC_URL;
    delete process.env.ZKSYNC_RPC_URL;
    delete process.env.SPACEPORT_NFT_ADDRESS;
    delete process.env.FOMO_V2_LAUNCHPAD_STAKING_NFT_ADDRESS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses the current Spaceport NFT deployment by default', () => {
    const service = new SpaceportNftService();

    expect((service as any).getNftAddress()).toBe(
      '0x512c670006456d46679a67456ebe8564810c5609',
    );
  });

  it('shares the configured Launchpad RPC when no dedicated Spaceport RPC exists', () => {
    process.env.FOMO_V2_LAUNCHPAD_RPC_URL = 'https://bsc-testnet.example/rpc';
    process.env.ZKSYNC_RPC_URL = 'https://zksync.example/rpc';
    const service = new SpaceportNftService();

    expect((service as any).getRpcUrl()).toBe(
      'https://bsc-testnet.example/rpc',
    );
  });

  it('shares the configured Launchpad NFT when no dedicated Spaceport address exists', () => {
    process.env.FOMO_V2_LAUNCHPAD_STAKING_NFT_ADDRESS =
      '0x1111111111111111111111111111111111111111';
    const service = new SpaceportNftService();

    expect((service as any).getNftAddress()).toBe(
      '0x1111111111111111111111111111111111111111',
    );
  });

  it('fails closed instead of silently using an unrelated network', () => {
    const service = new SpaceportNftService();

    expect((service as any).getRpcUrl()).toBe('');
  });
});
