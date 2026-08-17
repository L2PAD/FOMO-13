import assert from "node:assert/strict";
import test from "node:test";

const constants = await import(new URL("./constants.ts", import.meta.url).href);

test("Launchpad and Spaceport stay pinned to the BSC testnet deployment", () => {
  assert.equal(constants.BSC_TESTNET_CHAIN_ID, 97);
  assert.equal(constants.FOMO_LAUNCHPAD_USDT_DECIMALS, 18);
  assert.equal(
    constants.FOMO_LAUNCHPAD_USDT_ADDRESS,
    "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948"
  );
  assert.equal(
    constants.FOMO_STAKING_NFT_ADDRESS,
    "0x512C670006456D46679A67456eBe8564810C5609"
  );
  assert.equal(
    constants.FOMO_NFT_MARKET_ADDRESS,
    "0x40198F1A090d9893d7822F8804e5317E28C5A776"
  );
  assert.equal(
    constants.FOMO_LAUNCHPAD_ADDRESS,
    "0x0608B52aAC58E7313481d0809E8b4525BDD11d33"
  );
});
