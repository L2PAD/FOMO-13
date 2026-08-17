const { ethers } = require('ethers');
const NFT = '0x512C670006456D46679A67456eBe8564810C5609';
const TRANSFER = ethers.id('Transfer(address,address,uint256)');
const rpcs = [
  'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
  'https://bsc-testnet-rpc.publicnode.com',
  'https://bsc-testnet.public.blastapi.io',
];
(async () => {
  for (const rpc of rpcs) {
    try {
      const p = new ethers.JsonRpcProvider(rpc);
      const head = await p.getBlockNumber();
      // full-range getLogs attempt
      let full = 'n/a';
      try {
        const logs = await p.getLogs({ address: NFT, topics: [TRANSFER], fromBlock: 0, toBlock: head });
        full = `OK ${logs.length} logs; blocks: ${logs.map(l=>l.blockNumber).join(',')}`;
      } catch (e) { full = 'ERR ' + (e.shortMessage || e.message); }
      // archive getCode at block 1000000
      let arch = 'n/a';
      try { const c = await p.getCode(NFT, 1000000); arch = c === '0x' ? 'pruned(0x)' : 'has-code'; } catch(e){ arch='ERR '+(e.shortMessage||e.message);}
      console.log(`\nRPC ${rpc}\n head=${head}\n fullGetLogs: ${full}\n getCode@1M: ${arch}`);
    } catch (e) { console.log(`RPC ${rpc} FAILED ${e.message}`); }
  }
})();
