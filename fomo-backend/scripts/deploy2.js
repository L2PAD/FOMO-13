const RPC='https://bsc-testnet-rpc.publicnode.com';
const NFT='0x512C670006456D46679A67456eBe8564810C5609';
const SALE='0x40198F1A090d9893d7822F8804e5317E28C5A776';
async function raw(method,params){const r=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});return r.json();}
const hx=(n)=>'0x'+n.toString(16);
async function code(addr,bn){const r=await raw('eth_getCode',[addr,hx(bn)]);return r.error?('ERR '+r.error.message):r.result;}
async function findDeploy(addr,head){
  let lo=0,hi=head;
  const now=await code(addr,head); if(!now||now==='0x'||now.startsWith('ERR'))return {block:null,note:now};
  while(lo<hi){const mid=Math.floor((lo+hi)/2);let c=await code(addr,mid);if(c&&c!=='0x'&&!c.startsWith('ERR'))hi=mid;else lo=mid+1;}
  return {block:lo};
}
(async()=>{
  const bn=await raw('eth_blockNumber',[]);const head=parseInt(bn.result,16);console.log('head',head);
  console.log('getCode@1,000,000:', (await code(NFT,1000000)).slice(0,12));
  console.log('getCode@100,000,000:', (await code(NFT,100000000)).slice(0,12));
  const nft=await findDeploy(NFT,head);console.log('NFT deploy:',nft.block,'depth',nft.block!=null?head-nft.block:'n/a');
  const sale=await findDeploy(SALE,head);console.log('SALE deploy:',sale.block,'depth',sale.block!=null?head-sale.block:'n/a');
})();
