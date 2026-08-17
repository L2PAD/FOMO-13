import assert from "node:assert/strict";
import test from "node:test";
import type { Address, Hash } from "viem";
import {
  approveLaunchpadInvestment,
  investInLaunchpadPool,
  stakeLaunchpadNfts,
  type LaunchpadWriteClients,
} from "./connector";

const account = "0x1111111111111111111111111111111111111111" as Address;
const token = "0x2222222222222222222222222222222222222222" as Address;
const launchpad = "0x3333333333333333333333333333333333333333" as Address;
const submittedHash = `0x${"a".repeat(64)}` as Hash;
const replacementHash = `0x${"b".repeat(64)}` as Hash;
const investmentHash = `0x${"c".repeat(64)}` as Hash;

test("write result promotes a mined replacement hash for backend recovery", async () => {
  let callbackHash: Hash | undefined;
  const clients = {
    account,
    walletClient: {
      writeContract: async () => submittedHash,
    },
    publicClient: {
      simulateContract: async () => ({ request: {} }),
      waitForTransactionReceipt: async ({ hash }: { hash: Hash }) => {
        assert.equal(hash, submittedHash);
        return {
          status: "success",
          transactionHash: replacementHash,
          blockNumber: 123n,
        };
      },
    },
  } as unknown as LaunchpadWriteClients;

  const result = await approveLaunchpadInvestment(
    clients,
    token,
    launchpad,
    1n,
    (hash) => {
      callbackHash = hash;
    }
  );

  assert.equal(callbackHash, submittedHash);
  assert.equal(result.submittedHash, submittedHash);
  assert.equal(result.hash, replacementHash);
  assert.equal(result.blockNumber, 123n);
});

test("reverted receipt is rejected even after the wallet reports submission", async () => {
  let callbackHash: Hash | undefined;
  const clients = {
    account,
    walletClient: {
      writeContract: async () => submittedHash,
    },
    publicClient: {
      simulateContract: async () => ({ request: {} }),
      waitForTransactionReceipt: async () => ({
        status: "reverted",
        transactionHash: submittedHash,
        blockNumber: 124n,
      }),
    },
  } as unknown as LaunchpadWriteClients;

  await assert.rejects(
    approveLaunchpadInvestment(
      clients,
      token,
      launchpad,
      1n,
      (hash) => { callbackHash = hash; }
    ),
    /wallet transaction was reverted/i
  );
  assert.equal(callbackHash, submittedHash);
});

test("simulation failure never submits a wallet transaction", async () => {
  let writes = 0;
  let submitted = false;
  const clients = {
    account,
    walletClient: {
      writeContract: async () => {
        writes += 1;
        return submittedHash;
      },
    },
    publicClient: {
      simulateContract: async () => { throw new Error("purchase window closed"); },
      waitForTransactionReceipt: async () => {
        throw new Error("receipt wait must not run");
      },
    },
  } as unknown as LaunchpadWriteClients;

  await assert.rejects(
    investInLaunchpadPool(
      clients,
      launchpad,
      7n,
      10n,
      () => { submitted = true; }
    ),
    /purchase window closed/i
  );
  assert.equal(writes, 0);
  assert.equal(submitted, false);
});

test("approval followed by participation sends the exact pool and amount", async () => {
  const simulations: Array<Record<string, any>> = [];
  const submitted: Hash[] = [];
  const writeHashes = [submittedHash, investmentHash];
  const clients = {
    account,
    walletClient: {
      writeContract: async () => writeHashes.shift() as Hash,
    },
    publicClient: {
      simulateContract: async (request: Record<string, any>) => {
        simulations.push(request);
        return { request: {} };
      },
      waitForTransactionReceipt: async ({ hash }: { hash: Hash }) => ({
        status: "success",
        transactionHash: hash,
        blockNumber: 125n,
      }),
    },
  } as unknown as LaunchpadWriteClients;

  await approveLaunchpadInvestment(
    clients,
    token,
    launchpad,
    25n,
    (hash) => submitted.push(hash)
  );
  await investInLaunchpadPool(
    clients,
    launchpad,
    7n,
    25n,
    (hash) => submitted.push(hash)
  );

  assert.deepEqual(submitted, [submittedHash, investmentHash]);
  assert.equal(simulations[0]?.functionName, "approve");
  assert.deepEqual(simulations[0]?.args, [launchpad, 25n]);
  assert.equal(simulations[1]?.functionName, "invest");
  assert.deepEqual(simulations[1]?.args, [7n, 25n]);
});

test("NFT staking rejects empty or duplicate selection before simulation", async () => {
  let simulations = 0;
  const clients = {
    account,
    walletClient: { writeContract: async () => submittedHash },
    publicClient: {
      simulateContract: async () => {
        simulations += 1;
        return { request: {} };
      },
      waitForTransactionReceipt: async () => ({
        status: "success",
        transactionHash: submittedHash,
        blockNumber: 126n,
      }),
    },
  } as unknown as LaunchpadWriteClients;

  await assert.rejects(
    stakeLaunchpadNfts(clients, launchpad, 7n, []),
    /select at least one NFT/i
  );
  await assert.rejects(
    stakeLaunchpadNfts(clients, launchpad, 7n, [9n, 9n]),
    /duplicate token IDs/i
  );
  assert.equal(simulations, 0);
});

test("NFT staking submits only the explicitly selected token IDs", async () => {
  let simulation: Record<string, any> | undefined;
  const clients = {
    account,
    walletClient: { writeContract: async () => submittedHash },
    publicClient: {
      simulateContract: async (request: Record<string, any>) => {
        simulation = request;
        return { request: {} };
      },
      waitForTransactionReceipt: async () => ({
        status: "success",
        transactionHash: submittedHash,
        blockNumber: 127n,
      }),
    },
  } as unknown as LaunchpadWriteClients;

  await stakeLaunchpadNfts(clients, launchpad, 7n, [12n, 5n]);
  assert.equal(simulation?.functionName, "stakeNfts");
  assert.deepEqual(simulation?.args, [7n, [12n, 5n]]);
});
