const { ethers } = require('ethers');
const RPC='https://bsc-testnet-rpc.publicnode.com';
const SALE='0x40198F1A090d9893d7822F8804e5317E28C5A776';
const NFT='0x512C670006456D46679A67456eBe8564810C5609';
const abi=['function owner() view returns (address)','function price() view returns (uint256)','function totalSupply() view returns (uint256)'];
(async()=>{
  const p=new ethers.JsonRpcProvider(RPC,{chainId:97,name:'bsct'},{staticNetwork:true});
  const s=new ethers.Contract(SALE,abi,p); const n=new ethers.Contract(NFT,abi,p);
  console.log('sale.owner', await s.owner());
  console.log('sale.price', (await s.price()).toString());
  console.log('nft.totalSupply', (await n.totalSupply()).toString());
  // sample getLogs near SALE deploy for Purchased
  const PURCH = ethers.id('Purchased(address,uint256,uint256,address)');
  const logs = await p.getLogs({address:SALE, topics:[PURCH], fromBlock:115112716, toBlock:115112716+50000});
  console.log('Purchased logs in first 50k after sale deploy:', logs.length, logs.map(l=>l.blockNumber));
})().catch(e=>console.log('ERR',e.message));
