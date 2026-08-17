import { parseAbi } from "viem";

export const launchpadAbi = parseAbi([
  "function invest(uint256 poolId, uint256 amount)",
  "function claim(uint256 receiptTokenId)",
  "function stakeNfts(uint256 poolId, uint256[] tokenIds)",
  "function unstakePoolNfts(uint256 poolId)",
  "function canUserInvestNow(uint256 poolId, address user) view returns (bool)",
  "function getUserMaxAllowedNow(uint256 poolId, address user) view returns (uint256)",
  "function getUserZone(uint256 poolId, address user) view returns (uint8)",
  "function getUserRank(uint256 poolId, address user) view returns (uint256)",
  "function getUserStakeCount(uint256 poolId, address user) view returns (uint256)",
  "function getUserStakedTokenIds(uint256 poolId, address user) view returns (uint256[])",
  "function userTokenPoolUsageCount(address user, uint256 tokenId) view returns (uint256)",
  "function isTokenStakedInPool(uint256 poolId, address user, uint256 tokenId) view returns (bool)",
  "function getUserYellowSlot(uint256 poolId, address user) view returns (uint256 slotStart, uint256 slotEnd)",
  "function getReceiptInfo(uint256 receiptTokenId) view returns (uint256 poolId, address investor, uint256 investedAmount, bool burned)",
  "function previewClaim(uint256 receiptTokenId) view returns (uint256)",
  "function getPoolInfo(uint256 poolId) view returns ((uint256 id,address investToken,uint256 targetAmount,uint256 raisedAmount,uint32 greenSeats,uint32 yellowSeats,uint64 stakeStart,uint64 greenStart,uint64 greenEnd,uint64 yellowSlotDuration,uint256 minInvestment,uint16 feePercent,address projectToken,uint256 projectTokenAmount,bool claimEnabled,bool stakeReleaseEnabled,bool closed,bool exists))",
]);

export const erc20LaunchpadAbi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

export const erc721LaunchpadAbi = parseAbi([
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]);
