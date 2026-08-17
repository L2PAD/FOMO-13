describe('Launchpad BSC testnet deployment defaults', () => {
  const overrideKeys = [
    'REACT_APP_LAUNCHPAD_USDT_ADDRESS',
    'REACT_APP_LAUNCHPAD_NFT_ADDRESS',
    'REACT_APP_LAUNCHPAD_NFT_MARKET_ADDRESS',
    'REACT_APP_LAUNCHPAD_ADDRESS',
  ] as const;
  const originalValues = new Map(overrideKeys.map((key) => [key, process.env[key]]));

  beforeEach(() => {
    jest.resetModules();
    overrideKeys.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    overrideKeys.forEach((key) => {
      const value = originalValues.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it('pins chain 97 and all four current contract addresses', () => {
    const { LAUNCHPAD_CHAIN_ID, launchpadDeployment } = require('./config') as typeof import('./config');

    expect(LAUNCHPAD_CHAIN_ID).toBe(97);
    expect(launchpadDeployment).toMatchObject({
      chainId: 97,
      chainIdHex: '0x61',
      chainName: 'BSC Testnet',
      contracts: {
        usdt: '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948',
        nft: '0x512C670006456D46679A67456eBe8564810C5609',
        nftMarket: '0x40198F1A090d9893d7822F8804e5317E28C5A776',
        launchpad: '0x0608B52aAC58E7313481d0809E8b4525BDD11d33',
      },
    });
  });
});
