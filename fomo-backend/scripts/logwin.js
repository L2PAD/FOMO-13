const NFT='0x512C670006456D46679A67456eBe8564810C5609';
async function gl(rpc,from,to){
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),12000);
  try{const r=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getLogs',params:[{address:NFT,fromBlock:'0x'+from.toString(16),toBlock:'0x'+to.toString(16)}]}),signal:ctrl.signal});return await r.json();}catch(e){return{error:{message:'fetch '+e.message}};}finally{clearTimeout(t);}
}
async function head(rpc){const r=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]})});const j=await r.json();return j.result?parseInt(j.result,16):null;}
(async()=>{
  const PN='https://bsc-testnet-rpc.publicnode.com';
  const h=await head(PN);console.log('publicnode head',h);
  for (const back of [20000,100000,500000,1000000,3000000,5000000]){
    const from=h-back, to=Math.min(h,from+20000);
    const r=await gl(PN,from,to);
    console.log(`  back ${back}: ${r.error?('ERR '+JSON.stringify(r.error).slice(0,70)):('OK '+r.result.length+' logs')}`);
  }
  // Ankr + 1rpc + llama archive test at deep block
  for (const rpc of ['https://rpc.ankr.com/bsc_testnet_chapel','https://bsc-testnet.rpc.thirdweb.com']){
    const hh=await head(rpc); if(!hh){console.log(`\n${rpc}: no head`);continue;}
    const r=await gl(rpc, hh-5000000, hh-5000000+40000);
    console.log(`\n${rpc} head=${hh}\n  deep getLogs(5M back,40k): ${r.error?('ERR '+JSON.stringify(r.error).slice(0,90)):('OK '+r.result.length)}`);
  }
})();
