const NFT = '0x512C670006456D46679A67456eBe8564810C5609';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const rpcs = [
  'https://bsc-testnet-rpc.publicnode.com',
  'https://data-seed-prebsc-2-s1.bnbchain.org:8545',
  'https://bsc-testnet.blockpi.network/v1/rpc/public',
  'https://endpoints.omniatech.io/v1/bsc/testnet/public',
  'https://bsc-testnet.drpc.org',
  'https://api.zan.top/bsc-testnet',
];
async function raw(rpc, method, params, id=1){
  const ctrl = new AbortController(); const t=setTimeout(()=>ctrl.abort(), 12000);
  try {
    const r = await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal:ctrl.signal});
    return await r.json();
  } catch(e){ return {error:{message:'fetch '+(e.message||e)}}; } finally { clearTimeout(t); }
}
(async()=>{
  for (const rpc of rpcs){
    const bn = await raw(rpc,'eth_blockNumber',[]);
    if (bn.error){ console.log(`\n${rpc}\n  blockNumber ERR ${JSON.stringify(bn.error).slice(0,80)}`); continue; }
    const head = parseInt(bn.result,16);
    const hx=(n)=>'0x'+n.toString(16);
    // full-range getLogs for NFT transfer
    const fr = await raw(rpc,'eth_getLogs',[{address:NFT,topics:[TRANSFER],fromBlock:'0x0',toBlock:hx(head)}]);
    let full = fr.error? ('ERR '+JSON.stringify(fr.error).slice(0,90)) : `OK ${fr.result.length} logs @blocks ${[...new Set(fr.result.map(l=>parseInt(l.blockNumber,16)))].join(',')}`;
    console.log(`\n${rpc}\n  head=${head}\n  fullGetLogs: ${full}`);
  }
})();
