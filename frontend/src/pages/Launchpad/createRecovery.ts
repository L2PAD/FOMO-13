import {
  LaunchpadPool,
  LaunchpadVerification,
} from '../../components/services/fomoV2Launchpad';

type RetrySignal = Pick<LaunchpadVerification, 'failureKind' | 'safeToRetry'>;

export const isExplicitlyRevertedCreate = (signal?: RetrySignal | null): boolean => (
  signal?.failureKind === 'reverted' && signal.safeToRetry === true
);

export const isExplicitlyCancelledCreate = (signal?: RetrySignal | null): boolean => (
  signal?.failureKind === 'cancelled' && signal.safeToRetry === true
);

export const isExplicitlyResettableCreate = (signal?: RetrySignal | null): boolean => (
  isExplicitlyRevertedCreate(signal) || isExplicitlyCancelledCreate(signal)
);

export const launchpadCreateTransactionHash = (pool?: LaunchpadPool | null): string => (
  String(pool?.createTransaction?.transactionHash || pool?.createTxHash || '').trim()
);

export const isUnresolvedLaunchpadCreate = (pool: LaunchpadPool): boolean => {
  if (!launchpadCreateTransactionHash(pool)) return false;
  if (pool.status !== 'failed' && pool.status !== 'tx_submitted') return false;

  // Even a proved revert/cancellation remains a backend record until the
  // explicit reset endpoint completes. This prevents a reload or unavailable
  // localStorage from bypassing the audited reset step.
  return true;
};
