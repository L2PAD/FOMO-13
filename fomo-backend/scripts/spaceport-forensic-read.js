/* eslint-disable */
// One-off READ-ONLY forensic probe against BSC Testnet Spaceport contracts.
const { ethers } = require('ethers');

const RPC = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const MARKET = '0x40198F1A090d9893d7822F8804e5317E28C5A776';
const NFT = '0x512C670006456D46679A67456eBe8564810C5609';
const USDT = '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948';

const SALE_ABI = [
  'function owner() view returns (address)',
  'function paymentToken() view returns (address)',
  'function nftContract() view returns (address)',
  'function price() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function salePaused() view returns (bool)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function MAX_PER_WALLET() view returns (uint256)',
  'function getBaseTotalPrice(uint256 amount) view returns (uint256)',
];
const NFT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function nextTokenId() view returns (uint256)',
  'function baseURI() view returns (string)',
  'function active_tokens() view returns (uint256)',
  'function owner() view returns (address)',
];
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

async function safe(label, fn) {
  try { const v = await fn(); console.log('OK   ', label, '=', v?.toString?.() ?? v); return v; }
  catch (e) { console.log('FAIL ', label, '->', (e && e.shortMessage) || (e && e.message) || String(e)); return null; }
}

(async () => {
  console.log('RPC:', RPC);
  const provider = new ethers.JsonRpcProvider(RPC);
  const net = await safe('network.chainId', async () => (await provider.getNetwork()).chainId);
  const sale = new ethers.Contract(MARKET, SALE_ABI, provider);
  const nft = new ethers.Contract(NFT, NFT_ABI, provider);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);

  console.log('\n--- SALE (market) ' + MARKET + ' ---');
  await safe('sale.owner', () => sale.owner());
  const pt = await safe('sale.paymentToken', () => sale.paymentToken());
  const nc = await safe('sale.nftContract', () => sale.nftContract());
  const price = await safe('sale.price', () => sale.price());
  await safe('sale.totalMinted', () => sale.totalMinted());
  await safe('sale.salePaused', () => sale.salePaused());
  const maxSupply = await safe('sale.MAX_SUPPLY', () => sale.MAX_SUPPLY());
  await safe('sale.MAX_PER_WALLET', () => sale.MAX_PER_WALLET());
  await safe('sale.getBaseTotalPrice(1)', () => sale.getBaseTotalPrice(1));
  await safe('sale.getBaseTotalPrice(4)', () => sale.getBaseTotalPrice(4));

  console.log('\n--- NFT ' + NFT + ' ---');
  await safe('nft.name', () => nft.name());
  await safe('nft.symbol', () => nft.symbol());
  await safe('nft.totalSupply', () => nft.totalSupply());
  await safe('nft.nextTokenId', () => nft.nextTokenId());
  await safe('nft.baseURI', () => nft.baseURI());
  await safe('nft.active_tokens', () => nft.active_tokens());
  await safe('nft.owner', () => nft.owner());

  console.log('\n--- USDT ' + USDT + ' ---');
  await safe('usdt.symbol', () => usdt.symbol());
  await safe('usdt.decimals', () => usdt.decimals());

  if (price && maxSupply) {
    console.log('\nDerived: price(wei)=' + price.toString());
  }
  console.log('\nDONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
