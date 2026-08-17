const { ethers } = require('ethers');
const RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const targets = {
  sale: '0x40198F1A090d9893d7822F8804e5317E28C5A776',
  nft: '0x512C670006456D46679A67456eBe8564810C5609',
};
async function findDeploy(provider, addr) {
  let lo = 0, hi = await provider.getBlockNumber();
  const codeNow = await provider.getCode(addr, hi);
  if (codeNow === '0x') return null;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let code = '0x';
    try { code = await provider.getCode(addr, mid); } catch { code = '0x'; }
    if (code && code !== '0x') hi = mid; else lo = mid + 1;
  }
  return lo;
}
(async () => {
  const provider = new ethers.JsonRpcProvider(RPC);
  const head = await provider.getBlockNumber();
  console.log('head:', head);
  for (const [k, a] of Object.entries(targets)) {
    const b = await findDeploy(provider, a);
    console.log(k, 'deployBlock=', b, 'depth from head=', b!=null?head-b:'n/a');
  }
})().catch(e => console.error('ERR', e.message));
