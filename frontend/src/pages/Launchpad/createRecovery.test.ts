import {
  isExplicitlyCancelledCreate,
  isExplicitlyRevertedCreate,
  isExplicitlyResettableCreate,
  isUnresolvedLaunchpadCreate,
  launchpadCreateTransactionHash,
} from './createRecovery';
import { LaunchpadPool } from '../../components/services/fomoV2Launchpad';

const pool = (overrides: Partial<LaunchpadPool> = {}): LaunchpadPool => ({
  id: 'backend-pool-id',
  canonicalProjectId: 'project-id',
  chainId: 97,
  launchpadAddress: '0x0608B52aAC58E7313481d0809E8b4525BDD11d33',
  status: 'failed',
  createTransaction: {
    transactionHash: '0x8cbba176971c48a8f4685fec7864cef36f0264be12fc4aac154749042813d2e9',
  },
  ...overrides,
});

describe('Launchpad create recovery safety', () => {
  it('never treats a generic backend verification failure as safe to retry', () => {
    expect(isExplicitlyRevertedCreate()).toBe(false);
    expect(isExplicitlyRevertedCreate({ failureKind: 'integrity_mismatch', safeToRetry: true })).toBe(false);
    expect(isExplicitlyRevertedCreate({ failureKind: 'reverted', safeToRetry: false })).toBe(false);
    expect(isExplicitlyResettableCreate({ failureKind: 'integrity', safeToRetry: true })).toBe(false);
    expect(isExplicitlyResettableCreate({ safeToRetry: false })).toBe(false);
  });

  it('requires an explicit reverted and safe-to-retry signal', () => {
    expect(isExplicitlyRevertedCreate({ failureKind: 'reverted', safeToRetry: true })).toBe(true);
    expect(isExplicitlyCancelledCreate({ failureKind: 'cancelled', safeToRetry: true })).toBe(true);
    expect(isExplicitlyCancelledCreate({ failureKind: 'cancelled', safeToRetry: false })).toBe(false);
    expect(isExplicitlyResettableCreate({ failureKind: 'cancelled', safeToRetry: true })).toBe(true);
  });

  it('keeps failed and submitted pools with a transaction hash in recovery', () => {
    expect(isUnresolvedLaunchpadCreate(pool())).toBe(true);
    expect(isUnresolvedLaunchpadCreate(pool({ status: 'tx_submitted' }))).toBe(true);
    expect(launchpadCreateTransactionHash(pool())).toBe(
      '0x8cbba176971c48a8f4685fec7864cef36f0264be12fc4aac154749042813d2e9',
    );
    expect(isUnresolvedLaunchpadCreate(pool({
      status: 'tx_submitted',
      createTransaction: undefined,
      createTxHash: '0xlegacy-submitted-hash',
    }))).toBe(true);
  });

  it('keeps duplicate-submit protection for every unresolved backend record', () => {
    const records = [
      pool({ id: 'pending-1', status: 'tx_submitted' }),
      pool({ id: 'reverted-1', createTransaction: {
        transactionHash: '0xreverted',
        failureKind: 'reverted',
        safeToRetry: true,
      } }),
      pool({ id: 'cancelled-1', createTransaction: {
        transactionHash: '0xcancelled',
        failureKind: 'cancelled',
        safeToRetry: true,
      } }),
    ];

    expect(records.filter(isUnresolvedLaunchpadCreate).map((item) => item.id))
      .toEqual(['pending-1', 'reverted-1', 'cancelled-1']);
  });

  it('keeps proved failures locked until the explicit backend reset removes/resets the record', () => {
    expect(isUnresolvedLaunchpadCreate(pool({
      createTransaction: {
        transactionHash: '0xdead',
        failureKind: 'reverted',
        safeToRetry: true,
      },
    }))).toBe(true);
    expect(isUnresolvedLaunchpadCreate(pool({
      createTransaction: {
        transactionHash: '0xbeef',
        failureKind: 'cancelled',
        safeToRetry: true,
      },
    }))).toBe(true);
    expect(isUnresolvedLaunchpadCreate(pool({ status: 'active', poolId: '1' }))).toBe(false);
    expect(isUnresolvedLaunchpadCreate(pool({ createTransaction: undefined, createTxHash: undefined }))).toBe(false);
  });
});
