const { ethers } = require('ethers');
const NFT = '0x512C670006456D46679A67456eBe8564810C5609';
const RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
async function raw(method, params) {
  const r = await fetch(RPC, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  return r.json();
}
(async () => {
  const p = new ethers.JsonRpcProvider(RPC, { chainId: 97, name: 'bsct' }, { staticNetwork: true });
  const head = await p.getBlockNumber();
  const hx = (n)=>'0x'+n.toString(16);
  for (const span of [1000, 5000, 50000, 100000]) {
    const res = await raw('eth_getLogs', [{ address: NFT, fromBlock: hx(head-span), toBlock: hx(head) }]);
    if (res.error) console.log(`span ${span}: ERROR ${JSON.stringify(res.error).slice(0,180)}`);
    else console.log(`span ${span}: OK logs=${res.result.length}`);
  }
})().catch(e=>console.log('FATAL', e.message));
