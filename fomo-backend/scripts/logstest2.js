const { ethers } = require('ethers');
const NFT = '0x512C670006456D46679A67456eBe8564810C5609';
const SALE = '0x40198F1A090d9893d7822F8804e5317E28C5A776';
const TRANSFER = ethers.id('Transfer(address,address,uint256)');
const RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
(async () => {
  const p = new ethers.JsonRpcProvider(RPC, { chainId: 97, name: 'bsct' }, { staticNetwork: true });
  const head = await p.getBlockNumber();
  console.log('head', head);
  // 1) full range
  try {
    const logs = await p.getLogs({ address: NFT, topics: [TRANSFER], fromBlock: 0, toBlock: head });
    console.log('FULL range NFT Transfer:', logs.length, 'blocks:', [...new Set(logs.map(l=>l.blockNumber))].join(','));
  } catch (e) { console.log('FULL range ERR:', e.shortMessage || e.message, '| code:', e.code, '| info:', JSON.stringify(e.info||{}).slice(0,200)); }
  // 2) latest 50k
  try {
    const logs = await p.getLogs({ address: NFT, topics: [TRANSFER], fromBlock: head-50000, toBlock: head });
    console.log('last 50k NFT Transfer:', logs.length);
  } catch (e) { console.log('50k ERR:', e.shortMessage || e.message); }
  // 3) test big range 5,000,000
  try {
    const logs = await p.getLogs({ address: NFT, topics: [TRANSFER], fromBlock: head-5000000, toBlock: head });
    console.log('last 5M NFT Transfer:', logs.length, 'blocks:', [...new Set(logs.map(l=>l.blockNumber))].join(','));
  } catch (e) { console.log('5M ERR:', e.shortMessage || e.message); }
})().catch(e=>console.log('FATAL', e.message));
