import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/layouts/main_layout/layout';
import loader from '../../components/services/loader';
import {
  confirmLaunchpadPoolCreate,
  confirmLaunchpadPoolCreateCancellation,
  createLaunchpadDraft,
  deleteLaunchpadPlacement,
  fetchLaunchpadConfig,
  fetchLaunchpadPool,
  fetchLaunchpadPlacements,
  fetchLaunchpadPools,
  fetchLaunchpadProjects,
  fetchLaunchpadReadiness,
  LaunchpadAdminConfig,
  LaunchpadCanonicalProject,
  LaunchpadGlobalOperationType,
  LaunchpadPoolOperationType,
  LaunchpadPool,
  LaunchpadPoolParams,
  LaunchpadPoolVerificationResult,
  LaunchpadPlacement,
  LaunchpadPlacementSurface,
  LaunchpadVerification,
  reconcileLaunchpadPoolCreate,
  recordLaunchpadGlobalOperation,
  recordLaunchpadOperation,
  resetLaunchpadRevertedCreate,
  syncLaunchpadPoolContract,
  updateLaunchpadPublication,
  updateLaunchpadDetails,
  updateLaunchpadPlacement,
  upsertLaunchpadPlacement,
} from '../../components/services/fomoV2Launchpad';
import {
  addAdmin,
  adminUnstakeAllPoolUsers,
  closePoolIfFinished,
  connectLaunchpadAdmin,
  createPoolWithPredictedId,
  depositProjectTokens,
  formatTokenAmount,
  getLaunchpadAdminContext,
  LaunchpadAdminContext,
  LaunchpadTransactionCancelledError,
  launchpadDeployment,
  parseTokenAmount,
  readErc20Metadata,
  removeAdmin,
  setFeeReceiver,
  setInvestmentReceiver,
  transferOwnership,
  updatePoolFee,
  updatePoolMinInvestment,
} from '../../features/launchpadV2';
import {
  isExplicitlyRevertedCreate,
  isExplicitlyResettableCreate,
  isUnresolvedLaunchpadCreate,
  launchpadCreateTransactionHash,
} from './createRecovery';
import LaunchpadDetailsWizard, {
  cleanupLaunchpadSessionMedia,
  LaunchpadAssetField,
  markLaunchpadMediaPersisted,
  queueLaunchpadManagedMediaCleanup,
  retryLaunchpadMediaCleanup,
} from './LaunchpadDetailsWizard';
import {
  emptyLaunchpadDetailsForm,
  isLaunchpadUrl,
  launchpadDetailsFromForm,
  launchpadDetailsToForm,
  launchpadMediaUrlsFromDetails,
  launchpadMediaUrlsFromForm,
  launchpadReadinessMessages,
  LaunchpadDetailsForm,
  slugifyLaunchpad,
  validateLaunchpadDetails,
} from './launchDetailsForm';
import { durationMinutesToSeconds, normalizePositiveInteger } from './poolForm';
import { useStyles } from './styles';

type PageTab = 'pools' | 'create' | 'details' | 'placements';
type ProjectMode = 'existing' | 'new';
type CreatePhase = 'idle' | 'draft' | 'wallet' | 'broadcast' | 'confirming' | 'complete' | 'failed';
type GlobalAction =
  | 'add_admin'
  | 'remove_admin'
  | 'set_investment_receiver'
  | 'set_fee_receiver'
  | 'transfer_ownership';

interface CreateForm {
  investToken: string;
  targetAmount: string;
  minInvestment: string;
  greenSeats: string;
  yellowSeats: string;
  stakeStart: string;
  greenStart: string;
  greenEnd: string;
  yellowSlotDurationMinutes: string;
  feePercent: string;
}

interface NewProjectForm {
  name: string;
  symbol: string;
  slug: string;
  logo: string;
  website: string;
  description: string;
}

interface SubmittedTransaction {
  draftId: string;
  txHash: string;
  predictedPoolId: string;
  poolId?: string;
  replacesTxHash?: string;
  cancellationTxHash?: string;
}

interface TokenMetadata {
  address: string;
  symbol: string;
  decimals: number;
}

interface PendingOperation {
  scope: 'pool' | 'global';
  poolBackendId?: string;
  type: LaunchpadPoolOperationType | LaunchpadGlobalOperationType;
  txHash: string;
  params: Record<string, unknown>;
  createdAt: string;
}

interface PlacementForm {
  enabled: boolean;
  featured: boolean;
  ad: boolean;
  sortOrder: string;
  desktopUrl: string;
  mobileUrl: string;
  linkUrl: string;
  alt: string;
}

interface PlacementSurfaceOption {
  value: LaunchpadPlacementSurface;
  label: string;
  path: string;
  description: string;
}

const BSC_TESTNET_CHAIN_ID = 97;
const DEFAULT_USDT_DECIMALS = 18;
const CREATE_RECOVERY_KEY = 'fomo.launchpad.create-recovery.v1';
const CREATE_ATTEMPT_KEY = 'fomo.launchpad.create-attempt.v1';
const OPERATION_OUTBOX_KEY = 'fomo.launchpad.operation-outbox.v1';

const PLACEMENT_SURFACES: PlacementSurfaceOption[] = [
  {
    value: 'launchpad',
    label: 'Launchpad',
    path: '/utility/launchpad',
    description: 'Launch cards, Featured Project and advertising shown on the Launchpad page.',
  },
  {
    value: 'crypto_projects',
    label: 'Crypto projects',
    path: '/crypto/projects',
    description: 'A separate placement for the crypto projects catalogue. It is never inferred from Launchpad.',
  },
];

const emptyPlacementForm = (): PlacementForm => ({
  enabled: true,
  featured: false,
  ad: false,
  sortOrder: '0',
  desktopUrl: '',
  mobileUrl: '',
  linkUrl: '',
  alt: '',
});

const initialPlacementForms = (): Record<LaunchpadPlacementSurface, PlacementForm> => ({
  launchpad: emptyPlacementForm(),
  'crypto_projects': emptyPlacementForm(),
});

const placementToForm = (placement?: LaunchpadPlacement): PlacementForm => {
  if (!placement) return emptyPlacementForm();
  return {
    enabled: placement.enabled,
    featured: placement.featured,
    ad: placement.ad,
    sortOrder: String(placement.sortOrder),
    desktopUrl: placement.banner.desktopUrl || '',
    mobileUrl: placement.banner.mobileUrl || '',
    linkUrl: placement.banner.linkUrl || '',
    alt: placement.banner.alt || '',
  };
};

const readLocalJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const readLocalValue = (key: string, fallback = ''): string => {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const writeLocalJson = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // In-memory state and backend receipt verification remain authoritative.
  }
};

const writeLocalValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Privacy mode/quota failures must not interrupt an on-chain flow.
  }
};

const removeLocalValue = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
};

const newAttemptKey = (): string => (
  `admin-launchpad-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
);

const deploymentProblem = (
  config: LaunchpadAdminConfig | null,
  wallet: LaunchpadAdminContext | null,
): string => {
  if (!config) return 'Launchpad backend config is unavailable';
  if (config.rpcConfigured !== true) {
    return 'Backend RPC verification is disabled. Set FOMO_V2_LAUNCHPAD_RPC_URL before sending transactions.';
  }
  const mismatches: string[] = [];
  if (config.chainId !== launchpadDeployment.chainId) mismatches.push('chainId');
  if (config.launchpadAddress.toLowerCase() !== launchpadDeployment.contracts.launchpad.toLowerCase()) {
    mismatches.push('Launchpad address');
  }
  if (config.investTokenAddress.toLowerCase() !== launchpadDeployment.contracts.usdt.toLowerCase()) {
    mismatches.push('investment token');
  }
  if (config.stakingNftAddress && config.stakingNftAddress.toLowerCase() !== launchpadDeployment.contracts.nft.toLowerCase()) {
    mismatches.push('staking NFT');
  }
  if (config.nftMarketAddress && config.nftMarketAddress.toLowerCase() !== launchpadDeployment.contracts.nftMarket.toLowerCase()) {
    mismatches.push('NFT market');
  }
  if (wallet && wallet.launchpadAddress.toLowerCase() !== config.launchpadAddress.toLowerCase()) {
    mismatches.push('wallet adapter Launchpad address');
  }
  if (wallet && wallet.chainId !== config.chainId) mismatches.push('wallet chain');
  return mismatches.length
    ? `Backend and admin adapter deployment mismatch: ${mismatches.join(', ')}.`
    : '';
};

const dateTimeLocal = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const initialCreateForm = (): CreateForm => {
  const now = Date.now();
  return {
    investToken: '',
    targetAmount: '',
    minInvestment: '',
    greenSeats: '',
    yellowSeats: '0',
    stakeStart: dateTimeLocal(new Date(now + 60 * 60_000)),
    greenStart: dateTimeLocal(new Date(now + 2 * 60 * 60_000)),
    greenEnd: dateTimeLocal(new Date(now + 3 * 60 * 60_000)),
    yellowSlotDurationMinutes: '15',
    feePercent: '0',
  };
};

const initialNewProject: NewProjectForm = {
  name: '',
  symbol: '',
  slug: '',
  logo: '',
  website: '',
  description: '',
};

const shortAddress = (value?: string): string => {
  if (!value) return '-';
  if (value.length < 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
};

const timestampLabel = (value?: string): string => {
  if (!value || !/^\d+$/.test(value)) return '-';
  const milliseconds = Number(value) * 1000;
  if (!Number.isSafeInteger(milliseconds)) return value;
  return new Date(milliseconds).toLocaleString();
};

const unixSeconds = (value: string): string => {
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) throw new Error('All schedule dates must be valid');
  return String(Math.floor(milliseconds / 1000));
};

const isAddress = (value: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(value.trim());

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const rawGreaterThan = (left: string, right: string): boolean => {
  const normalizedLeft = left.replace(/^0+/, '') || '0';
  const normalizedRight = right.replace(/^0+/, '') || '0';
  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length > normalizedRight.length;
  }
  return normalizedLeft > normalizedRight;
};

const samePoolParams = (left: LaunchpadPoolParams, right: LaunchpadPoolParams): boolean => (
  (Object.keys(left) as Array<keyof LaunchpadPoolParams>)
    .every((key) => String(left[key]).toLowerCase() === String(right[key]).toLowerCase())
);

const normalizeCanonicalSlug = (value: string): string => value
  .normalize('NFKD')
  .trim()
  .toLowerCase()
  .replace(/['"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const sameNewCanonicalSnapshot = (
  project: LaunchpadCanonicalProject | undefined,
  formValue: NewProjectForm,
): boolean => {
  if (!project) return false;
  return project.name.trim() === formValue.name.trim()
    && String(project.symbol || '').trim().toUpperCase() === formValue.symbol.trim().toUpperCase()
    && String(project.slug || '').trim() === normalizeCanonicalSlug(formValue.slug || formValue.name)
    && String(project.logo || '').trim() === formValue.logo.trim()
    && String(project.website || '').trim() === formValue.website.trim()
    && String(project.descriptionText || '').trim() === formValue.description.trim();
};

const poolProjectName = (pool: LaunchpadPool): string => (
  pool.canonicalProject?.name || pool.canonicalProject?.canonicalName || pool.canonicalProjectId || 'Unknown project'
);

const poolStatusClass = (classes: ReturnType<typeof useStyles>, status: string): string => {
  if (status === 'active' || status === 'closed') return `${classes.status} ${classes.statusActive}`;
  if (status === 'failed') return `${classes.status} ${classes.statusFailed}`;
  if (status === 'tx_submitted' || status === 'transaction_submitted') {
    return `${classes.status} ${classes.statusPending}`;
  }
  return classes.status;
};

const createStep = (phase: CreatePhase): number => ({
  idle: 0,
  draft: 1,
  wallet: 2,
  broadcast: 3,
  confirming: 4,
  complete: 5,
  failed: 4,
}[phase]);

const LaunchpadAdminPage = () => {
  const classes = useStyles();
  const [tab, setTab] = useState<PageTab>('pools');
  const [config, setConfig] = useState<LaunchpadAdminConfig | null>(null);
  const [wallet, setWallet] = useState<LaunchpadAdminContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const [pools, setPools] = useState<LaunchpadPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [projectMode, setProjectMode] = useState<ProjectMode>('existing');
  const [projects, setProjects] = useState<LaunchpadCanonicalProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProject, setNewProject] = useState<NewProjectForm>(initialNewProject);
  const [form, setForm] = useState<CreateForm>(initialCreateForm);
  const [createDetailsForm, setCreateDetailsForm] = useState<LaunchpadDetailsForm>(
    emptyLaunchpadDetailsForm,
  );
  const [editDetailsForm, setEditDetailsForm] = useState<LaunchpadDetailsForm>(
    emptyLaunchpadDetailsForm,
  );
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedTransaction | null>(() => (
    readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null)
  ));
  const [phase, setPhase] = useState<CreatePhase>(() => (
    readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null) ? 'broadcast' : 'idle'
  ));
  const [createVerification, setCreateVerification] = useState<LaunchpadVerification | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
    return readLocalValue(CREATE_ATTEMPT_KEY) || newAttemptKey();
  });
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>(() => (
    readLocalJson<PendingOperation[]>(OPERATION_OUTBOX_KEY, [])
  ));
  const [operationLoading, setOperationLoading] = useState('');
  const [feeValue, setFeeValue] = useState('');
  const [minInvestmentValue, setMinInvestmentValue] = useState('');
  const [projectTokenAddress, setProjectTokenAddress] = useState('');
  const [projectTokenMetadata, setProjectTokenMetadata] = useState<TokenMetadata | null>(null);
  const [tokenMetadataLoading, setTokenMetadataLoading] = useState(false);
  const [projectTokenAmount, setProjectTokenAmount] = useState('');
  const [globalAction, setGlobalAction] = useState<GlobalAction>('add_admin');
  const [globalAddress, setGlobalAddress] = useState('');
  const [globalConfirmation, setGlobalConfirmation] = useState('');
  const [placements, setPlacements] = useState<LaunchpadPlacement[]>([]);
  const [placementForms, setPlacementForms] = useState<Record<LaunchpadPlacementSurface, PlacementForm>>(
    initialPlacementForms,
  );
  const [placementsLoading, setPlacementsLoading] = useState(false);
  const [placementSaving, setPlacementSaving] = useState<LaunchpadPlacementSurface | 'delete' | ''>('');

  const selectedPool = useMemo(
    () => pools.find((pool) => pool.id === selectedPoolId) || pools[0] || null,
    [pools, selectedPoolId],
  );
  const investTokenDecimals = Number(config?.investTokenDecimals ?? DEFAULT_USDT_DECIMALS);
  const investTokenSymbol = String(config?.investTokenSymbol || 'USDT');
  const currentStep = createStep(phase);
  const isCreating = phase !== 'idle' && phase !== 'complete' && phase !== 'failed';
  const canManagePools = Boolean(wallet?.isOwner || wallet?.isAdmin);
  const canManageGlobal = Boolean(wallet?.isOwner);
  const deploymentIssue = useMemo(() => deploymentProblem(config, wallet), [config, wallet]);
  const unresolvedCreatePools = useMemo(
    () => pools.filter(isUnresolvedLaunchpadCreate),
    [pools],
  );
  const selectedCanonicalProject = useMemo<LaunchpadCanonicalProject | undefined>(() => {
    if (projectMode === 'existing') {
      return projects.find((project) => project.id === selectedProjectId);
    }
    if (!newProject.name.trim()) return undefined;
    return {
      id: 'new-canonical-project',
      name: newProject.name.trim(),
      symbol: newProject.symbol.trim() || undefined,
      slug: newProject.slug.trim() || undefined,
      logo: newProject.logo.trim() || undefined,
      website: newProject.website.trim() || undefined,
      descriptionText: newProject.description.trim() || undefined,
      createdForLaunchpad: true,
    };
  }, [newProject, projectMode, projects, selectedProjectId]);
  const hasUnresolvedCreate = unresolvedCreatePools.length > 0;
  const submittedPool = useMemo(
    () => pools.find((pool) => pool.id === submitted?.draftId),
    [pools, submitted?.draftId],
  );
  const createResetSignal = createVerification || submittedPool?.createTransaction;
  const canResetCreateFailure = phase === 'failed'
    && isExplicitlyResettableCreate(createResetSignal);
  const mutationBusy = isCreating || detailsSaving || Boolean(operationLoading) || Boolean(placementSaving) || placementsLoading;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const cleanupAbandonedUploads = () => {
      cleanupLaunchpadSessionMedia({ keepalive: true }).catch(() => undefined);
    };
    window.addEventListener('beforeunload', cleanupAbandonedUploads);
    return () => {
      window.removeEventListener('beforeunload', cleanupAbandonedUploads);
      cleanupAbandonedUploads();
    };
  }, []);

  useEffect(() => {
    writeLocalValue(CREATE_ATTEMPT_KEY, idempotencyKey);
  }, [idempotencyKey]);

  useEffect(() => {
    const ethereum = (window as unknown as {
      ethereum?: {
        on?: (event: string, listener: () => void) => void;
        removeListener?: (event: string, listener: () => void) => void;
      };
    }).ethereum;
    if (!ethereum?.on) return undefined;
    const invalidateWallet = () => setWallet(null);
    ethereum.on('accountsChanged', invalidateWallet);
    ethereum.on('chainChanged', invalidateWallet);
    return () => {
      ethereum.removeListener?.('accountsChanged', invalidateWallet);
      ethereum.removeListener?.('chainChanged', invalidateWallet);
    };
  }, []);

  const loadPools = useCallback(async () => {
    const response = await fetchLaunchpadPools({ limit: 100, offset: 0 });
    setPools(response.items);
    setSelectedPoolId((current) => {
      if (current && response.items.some((pool) => pool.id === current)) return current;
      return response.items[0]?.id || '';
    });
  }, []);

  const applyPlacements = useCallback((items: LaunchpadPlacement[]) => {
    setPlacements(items);
    const launchpad = items.find((placement) => placement.surface === 'launchpad');
    const cryptoProjects = items.find((placement) => placement.surface === 'crypto_projects');
    setPlacementForms({
      launchpad: placementToForm(launchpad),
      'crypto_projects': placementToForm(cryptoProjects),
    });
  }, []);

  const loadPlacements = useCallback(async (poolId: string) => {
    setPlacementsLoading(true);
    setPlacements([]);
    setPlacementForms(initialPlacementForms());
    try {
      const response = await fetchLaunchpadPlacements({ poolId, limit: 10, offset: 0 });
      applyPlacements(response.items);
    } finally {
      setPlacementsLoading(false);
    }
  }, [applyPlacements]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [nextConfig] = await Promise.all([
        fetchLaunchpadConfig(),
        loadPools(),
      ]);
      setConfig(nextConfig);
      setForm((previous) => ({
        ...previous,
        investToken: previous.investToken || nextConfig.investTokenAddress,
      }));
      try {
        setWallet(await getLaunchpadAdminContext());
      } catch {
        // Reading wallet context is optional until the admin explicitly connects.
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load Launchpad');
    } finally {
      setLoading(false);
    }
  }, [loadPools]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (tab !== 'create' || projectMode !== 'existing') return undefined;
    const timer = window.setTimeout(async () => {
      setProjectsLoading(true);
      try {
        const response = await fetchLaunchpadProjects(projectSearch, 40);
        setProjects(response.items);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to load projects');
      } finally {
        setProjectsLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [projectMode, projectSearch, tab]);

  useEffect(() => {
    if (tab !== 'create' || createDetailsForm.slug || !selectedCanonicalProject) return;
    const suggestedSlug = slugifyLaunchpad(
      selectedCanonicalProject.slug || selectedCanonicalProject.name,
    );
    if (suggestedSlug) {
      setCreateDetailsForm((previous) => ({ ...previous, slug: suggestedSlug }));
    }
  }, [
    createDetailsForm.slug,
    selectedCanonicalProject,
    tab,
  ]);

  useEffect(() => {
    if (tab !== 'details' || !selectedPool) return;
    setEditDetailsForm(launchpadDetailsToForm(
      selectedPool.slug,
      selectedPool.launchDetails,
    ));
  }, [selectedPool?.id, selectedPool?.revision, tab]);

  useEffect(() => {
    const poolId = selectedPool?.id;
    if (tab !== 'details' || !poolId) return undefined;
    let cancelled = false;
    fetchLaunchpadReadiness(poolId)
      .then((readiness) => {
        if (cancelled) return;
        setPools((current) => current.map((pool) => (
          pool.id === poolId ? { ...pool, readiness } : pool
        )));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load publication readiness');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPool?.id, tab]);

  useEffect(() => {
    if (tab !== 'placements' || !selectedPool?.id) return;
    loadPlacements(selectedPool.id).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load page placements');
    });
  }, [loadPlacements, selectedPool?.id, tab]);

  const connectWallet = async () => {
    setWalletLoading(true);
    try {
      const context = await connectLaunchpadAdmin();
      setWallet(context);
      if (!context.isOwner && !context.isAdmin) {
        toast.warning('Connected wallet has no Launchpad owner/admin role');
      } else {
        toast.success('Launchpad admin wallet connected');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Wallet connection failed');
    } finally {
      setWalletLoading(false);
    }
  };

  const persistSubmission = (value: SubmittedTransaction) => {
    setSubmitted(value);
    writeLocalJson(CREATE_RECOVERY_KEY, value);
  };

  const completeSubmissionRecovery = () => {
    removeLocalValue(CREATE_RECOVERY_KEY);
    const nextKey = newAttemptKey();
    setIdempotencyKey(nextKey);
    writeLocalValue(CREATE_ATTEMPT_KEY, nextKey);
  };

  const resetDraftAttempt = () => {
    if (readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null)) {
      toast.error('Reconcile the broadcast transaction before starting another create attempt');
      return;
    }
    if (hasUnresolvedCreate) {
      toast.error('Reconcile the existing on-chain create transaction before starting another launch');
      return;
    }
    const nextKey = newAttemptKey();
    setIdempotencyKey(nextKey);
    setSubmitted(null);
    setCreateVerification(null);
    setPhase('idle');
    toast.info('A fresh idempotency key will be used for the next backend draft');
  };

  const resetVerifiedFailedCreate = async (
    pool: LaunchpadPool,
    signal: Pick<LaunchpadVerification, 'failureKind' | 'safeToRetry'> | undefined,
  ) => {
    if (!isExplicitlyResettableCreate(signal)) {
      toast.error('Create recovery cannot be reset without explicit backend chain proof that it is safe to retry.');
      return;
    }
    const reason = signal?.failureKind === 'cancelled'
      ? 'a mined wallet cancellation'
      : 'an on-chain revert';
    if (!window.confirm(`The backend verified ${reason}. Reset this failed backend create attempt and unlock a fresh draft?`)) {
      return;
    }

    setOperationLoading('reset-create');
    try {
      await resetLaunchpadRevertedCreate(pool.id);
      const localRecovery = readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null);
      if (localRecovery?.draftId === pool.id || submitted?.draftId === pool.id) {
        removeLocalValue(CREATE_RECOVERY_KEY);
        setSubmitted(null);
        setCreateVerification(null);
        setPhase('idle');
      }
      const nextKey = newAttemptKey();
      setIdempotencyKey(nextKey);
      await loadPools();
      toast.success('Verified failed create was reset by the backend. A fresh draft attempt is now unlocked.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset verified create');
    } finally {
      setOperationLoading('');
    }
  };

  const applyCreateReconciliation = (
    reconciliation: LaunchpadPoolVerificationResult,
    successMessage: string,
  ) => {
    const { pool, verification } = reconciliation;
    setCreateVerification(verification);
    setSelectedPoolId(pool.id);

    if (pool.status === 'active' && pool.poolId) {
      setSubmitted((current) => (current ? { ...current, poolId: pool.poolId } : current));
      setPhase('complete');
      completeSubmissionRecovery();
      toast.success(successMessage.replace('{poolId}', pool.poolId));
      return;
    }

    if (verification.status === 'failed' || pool.status === 'failed') {
      setPhase('failed');
      const reason = verification.reason || pool.lastError || 'Backend integrity verification failed without a reason.';
      if (isExplicitlyRevertedCreate(verification)) {
        toast.error(`Create transaction reverted on-chain: ${reason}`);
      } else {
        toast.error(`Backend could not safely link the existing transaction: ${reason} Do not create another pool; retry reconciliation.`);
      }
      return;
    }

    setPhase('broadcast');
    toast.info(`Backend verification is ${verification.status}: ${verification.reason || 'waiting for chain data or confirmations'}. Do not create another pool.`);
  };

  const applyCreateCancellationVerification = (
    reconciliation: LaunchpadPoolVerificationResult,
  ) => {
    const { pool, verification } = reconciliation;
    setCreateVerification(verification);
    setSelectedPoolId(pool.id);
    if (isExplicitlyResettableCreate(verification)) {
      setPhase('failed');
      toast.warning('Backend verified the mined wallet cancellation. Use the explicit backend reset action before creating another pool.');
      return;
    }
    if (verification.status === 'failed') {
      setPhase('failed');
      toast.error(`Cancellation could not be proved safe: ${verification.reason || 'backend integrity verification failed'}. Do not clear recovery.`);
      return;
    }
    setPhase('broadcast');
    toast.info(`Wallet cancellation verification is ${verification.status}. Recovery remains locked until chain proof is final.`);
  };

  const queuePendingOperation = (operation: PendingOperation) => {
    setPendingOperations((current) => {
      const next = [
        operation,
        ...current.filter((item) => item.txHash.toLowerCase() !== operation.txHash.toLowerCase()),
      ];
      writeLocalJson(OPERATION_OUTBOX_KEY, next);
      return next;
    });
  };

  const clearPendingOperation = (txHash: string) => {
    setPendingOperations((current) => {
      const next = current.filter((item) => item.txHash.toLowerCase() !== txHash.toLowerCase());
      writeLocalJson(OPERATION_OUTBOX_KEY, next);
      return next;
    });
  };

  const updateForm = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const updateNewProject = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewProject((previous) => ({ ...previous, [name]: value }));
  };

  const normalizedPoolParams = (): LaunchpadPoolParams => {
    if (!isAddress(form.investToken)) throw new Error('Investment token address is invalid');
    const stakeStart = unixSeconds(form.stakeStart);
    const greenStart = unixSeconds(form.greenStart);
    const greenEnd = unixSeconds(form.greenEnd);
    if (!(Number(stakeStart) < Number(greenStart) && Number(greenStart) < Number(greenEnd))) {
      throw new Error('Schedule must satisfy Stake start < Green start < Green end');
    }
    if (Number(stakeStart) <= Math.floor(Date.now() / 1000) + 60) {
      throw new Error('NFT staking start must be at least one minute in the future');
    }

    const targetAmount = parseTokenAmount(form.targetAmount, investTokenDecimals);
    const minInvestment = parseTokenAmount(form.minInvestment, investTokenDecimals);
    if (targetAmount === '0') throw new Error('Target amount must be greater than zero');
    if (minInvestment === '0') throw new Error('Minimum investment must be greater than zero');
    if (rawGreaterThan(minInvestment, targetAmount)) {
      throw new Error('Minimum investment cannot exceed the pool target');
    }

    const feePercent = normalizePositiveInteger(form.feePercent, 'Fee percent', true);
    if (Number(feePercent) > 100) throw new Error('Fee percent cannot exceed 100');
    return {
      investToken: form.investToken.trim(),
      targetAmount,
      greenSeats: normalizePositiveInteger(form.greenSeats, 'Green seats'),
      yellowSeats: normalizePositiveInteger(form.yellowSeats, 'Yellow seats', true),
      stakeStart,
      greenStart,
      greenEnd,
      yellowSlotDuration: durationMinutesToSeconds(
        form.yellowSlotDurationMinutes,
        'Yellow slot duration',
      ),
      minInvestment,
      feePercent,
    };
  };

  const validateProject = () => {
    if (projectMode === 'existing' && !selectedProjectId) {
      throw new Error('Select an existing canonical project');
    }
    if (projectMode === 'new' && !newProject.name.trim()) {
      throw new Error('Project name is required');
    }
    if (projectMode === 'new' && newProject.name.length > 300) {
      throw new Error('Project name must not exceed 300 characters');
    }
    if (projectMode === 'new' && newProject.symbol.length > 40) {
      throw new Error('Project symbol must not exceed 40 characters');
    }
    if (projectMode === 'new' && newProject.slug) {
      if (newProject.slug.length > 160) throw new Error('Project slug must not exceed 160 characters');
      if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(newProject.slug.trim())) {
        throw new Error('Project slug may contain only letters, numbers and single hyphens');
      }
    }
    if (projectMode === 'new' && newProject.logo.length > 2_048) {
      throw new Error('Project logo URL must not exceed 2048 characters');
    }
    if (projectMode === 'new' && newProject.website.length > 2_048) {
      throw new Error('Project website must not exceed 2048 characters');
    }
    if (projectMode === 'new' && newProject.description.length > 50_000) {
      throw new Error('Project description must not exceed 50000 characters');
    }
    if (projectMode === 'new' && newProject.website && !isAbsoluteHttpUrl(newProject.website)) {
      throw new Error('Project website must be a valid absolute http(s) URL');
    }
    if (projectMode === 'new' && newProject.logo && !isLaunchpadUrl(newProject.logo)) {
      throw new Error('Project logo must be a valid http(s) URL or stored upload path');
    }
  };

  const createLaunch = async () => {
    let broadcasted = false;
    let createDraftId = '';
    let broadcastSubmission: SubmittedTransaction | null = null;
    try {
      if (hasUnresolvedCreate) {
        throw new Error('An existing create transaction still requires reconciliation. Recover it from Pools & actions before signing another pool.');
      }
      validateProject();
      const launchDetailsIssues = validateLaunchpadDetails(
        createDetailsForm,
        selectedCanonicalProject,
      );
      if (launchDetailsIssues.length) throw new Error(launchDetailsIssues[0]);
      const params = normalizedPoolParams();
      if (!config) throw new Error('Launchpad config is not loaded');
      if (deploymentIssue) throw new Error(deploymentIssue);
      if (operationLoading) throw new Error('Wait for the current Launchpad operation to finish');
      if (!wallet?.isOwner && !wallet?.isAdmin) {
        throw new Error('Connect a wallet with Launchpad owner/admin role');
      }

      setSubmitted(null);
      setCreateVerification(null);
      setPhase('draft');
      let draft = await createLaunchpadDraft({
        ...(projectMode === 'existing'
          ? { canonicalProjectId: selectedProjectId }
          : {
            newCanonicalProject: {
              name: newProject.name.trim(),
              symbol: newProject.symbol.trim() || undefined,
              slug: newProject.slug.trim() || undefined,
              logo: newProject.logo.trim() || undefined,
              website: newProject.website.trim() || undefined,
              description: newProject.description.trim() || undefined,
            },
          }),
        chainId: config.chainId,
        launchpadAddress: config.launchpadAddress,
        slug: createDetailsForm.slug.trim(),
        launchDetails: launchpadDetailsFromForm(createDetailsForm),
        ...params,
        metadata: {
          createdFrom: 'front-admin',
          amountDisplayDecimals: investTokenDecimals,
        },
        idempotencyKey,
      });
      createDraftId = draft.id;
      markLaunchpadMediaPersisted([
        ...launchpadMediaUrlsFromDetails(draft.launchDetails),
        draft.canonicalProject?.logo || '',
      ]);

      const smartParams = draft.createParams;
      if (!smartParams) throw new Error('Backend draft returned no normalized createPool parameters');
      if (!samePoolParams(smartParams, params)) {
        throw new Error('This idempotency attempt already has different pool parameters. Start a fresh draft attempt before signing.');
      }
      if (projectMode === 'existing' && draft.canonicalProjectId !== selectedProjectId) {
        throw new Error('This idempotency attempt is linked to a different canonical project. Start a fresh draft attempt before signing.');
      }
      if (
        projectMode === 'new'
        && !sameNewCanonicalSnapshot(draft.canonicalProject, newProject)
      ) {
        throw new Error('This idempotency attempt already created a different canonical project snapshot. Start a fresh draft attempt before signing.');
      }
      if (draft.status !== 'draft') {
        throw new Error(`This idempotency attempt is already ${draft.status}. Reconcile its existing transaction instead of signing another pool.`);
      }
      if (typeof draft.revision !== 'number') {
        throw new Error('Backend draft returned no revision; refusing to sign without an optimistic editorial update');
      }

      // An idempotent create may replay an older draft. Replace its complete
      // editorial snapshot before the wallet is opened, and never patch after
      // a transaction has been broadcast.
      draft = await updateLaunchpadDetails(draft.id, {
        expectedRevision: draft.revision,
        slug: createDetailsForm.slug.trim(),
        launchDetails: launchpadDetailsFromForm(createDetailsForm),
      });
      markLaunchpadMediaPersisted(launchpadMediaUrlsFromForm(createDetailsForm));
      await retryLaunchpadMediaCleanup();

      setPhase('wallet');
      const result = await createPoolWithPredictedId({
        ...smartParams,
        confirmations: config.confirmations,
        onSubmitted: async ({ txHash, predictedPoolId }) => {
          broadcasted = true;
          setPhase('broadcast');
          broadcastSubmission = { draftId: draft.id, txHash, predictedPoolId };
          persistSubmission(broadcastSubmission);
          try {
            await confirmLaunchpadPoolCreate(draft.id, { txHash, predictedPoolId });
          } catch (error: unknown) {
            // The tx is already on-chain. A mined receipt/reconcile retry below remains authoritative.
            toast.warning(error instanceof Error
              ? `Transaction sent; initial backend sync failed: ${error.message}`
              : 'Transaction sent; initial backend sync failed');
          }
        },
      });

      setPhase('confirming');
      persistSubmission({
        draftId: draft.id,
        txHash: result.txHash,
        predictedPoolId: result.predictedPoolId,
        poolId: result.poolId,
        replacesTxHash: result.submittedTxHash,
      });
      await confirmLaunchpadPoolCreate(draft.id, {
        txHash: result.txHash,
        predictedPoolId: result.predictedPoolId,
        ...(result.submittedTxHash && result.submittedTxHash !== result.txHash
          ? { replacesTxHash: result.submittedTxHash }
          : {}),
      });
      const reconciliation = await reconcileLaunchpadPoolCreate(draft.id);
      await loadPools();
      applyCreateReconciliation(
        reconciliation,
        'Launchpad pool #{poolId} created and linked to the project',
      );
    } catch (error: unknown) {
      if (error instanceof LaunchpadTransactionCancelledError && createDraftId) {
        const recovery = broadcastSubmission
          || readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null);
        if (recovery) {
          persistSubmission({ ...recovery, cancellationTxHash: error.replacementTxHash });
        }
        setPhase('confirming');
        try {
          const cancellation = await confirmLaunchpadPoolCreateCancellation(createDraftId, {
            replacementTxHash: error.replacementTxHash,
          });
          await loadPools();
          applyCreateCancellationVerification(cancellation);
        } catch (verificationError: unknown) {
          setPhase('broadcast');
          toast.error(verificationError instanceof Error
            ? `Wallet cancellation was mined, but backend proof failed: ${verificationError.message}`
            : 'Wallet cancellation was mined, but backend proof failed');
        }
        return;
      }
      const hasStoredSubmission = Boolean(readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null));
      setPhase((current) => (current === 'complete' ? current : broadcasted || hasStoredSubmission ? 'broadcast' : 'idle'));
      toast.error(error instanceof Error ? error.message : 'Launch creation failed');
    }
  };

  const retryReconcile = async () => {
    if (!submitted?.draftId) return;
    setPhase('confirming');
    try {
      if (submitted.cancellationTxHash) {
        const cancellation = await confirmLaunchpadPoolCreateCancellation(submitted.draftId, {
          replacementTxHash: submitted.cancellationTxHash,
        });
        await loadPools();
        applyCreateCancellationVerification(cancellation);
        return;
      }
      await confirmLaunchpadPoolCreate(submitted.draftId, {
        txHash: submitted.txHash,
        predictedPoolId: submitted.predictedPoolId,
        replacesTxHash: submitted.replacesTxHash,
      });
      const reconciliation = await reconcileLaunchpadPoolCreate(submitted.draftId);
      await loadPools();
      applyCreateReconciliation(
        reconciliation,
        'Pool #{poolId} reconciled with the confirmed on-chain event',
      );
    } catch (error: unknown) {
      const hasStoredSubmission = Boolean(readLocalJson<SubmittedTransaction | null>(CREATE_RECOVERY_KEY, null));
      setPhase(submitted || hasStoredSubmission ? 'broadcast' : 'idle');
      toast.error(error instanceof Error ? error.message : 'Reconciliation failed');
    }
  };

  const reconcileExistingPoolCreate = async (pool: LaunchpadPool) => {
    const txHash = launchpadCreateTransactionHash(pool);
    if (!txHash) {
      toast.error('This backend pool has no stored create transaction hash to reconcile');
      return;
    }

    persistSubmission({
      draftId: pool.id,
      txHash,
      predictedPoolId: pool.predictedPoolId || '',
      poolId: pool.poolId,
    });
    setCreateVerification(null);
    setPhase('confirming');
    setOperationLoading('reconcile-create');
    try {
      const reconciliation = await reconcileLaunchpadPoolCreate(pool.id);
      await loadPools();
      applyCreateReconciliation(
        reconciliation,
        'Pool #{poolId} recovered from the existing on-chain transaction',
      );
    } catch (error: unknown) {
      setPhase('broadcast');
      toast.error(error instanceof Error ? error.message : 'Existing create transaction reconciliation failed');
    } finally {
      setOperationLoading('');
    }
  };

  const runPoolOperation = async (
    key: string,
    type: LaunchpadPoolOperationType,
    params: Record<string, unknown>,
    transaction: (
      onSubmitted: (submission: { txHash: string }) => void,
    ) => Promise<{ txHash: string; submittedTxHash?: string }>,
  ) => {
    if (mutationBusy) {
      toast.error('Wait for the current Launchpad mutation to finish');
      return;
    }
    if (deploymentIssue) {
      toast.error(deploymentIssue);
      return;
    }
    if (!canManagePools) {
      toast.error('Connect a wallet with Launchpad owner/admin role');
      return;
    }
    if (!selectedPool?.poolId) {
      toast.error('Select an active pool with an on-chain pool ID');
      return;
    }
    setOperationLoading(key);
    const pendingFor = (txHash: string): PendingOperation => ({
      scope: 'pool',
      poolBackendId: selectedPool.id,
      type,
      txHash,
      params,
      createdAt: new Date().toISOString(),
    });
    let submittedTxHash = '';
    try {
      const result = await transaction(({ txHash }) => {
        submittedTxHash = txHash;
        queuePendingOperation(pendingFor(txHash));
      });
      if (submittedTxHash && submittedTxHash.toLowerCase() !== result.txHash.toLowerCase()) {
        clearPendingOperation(submittedTxHash);
      }
      queuePendingOperation(pendingFor(result.txHash));
      try {
        const recorded = await recordLaunchpadOperation(selectedPool.id, { type, txHash: result.txHash, params });
        if (recorded.verification.status !== 'confirmed') {
          toast.info(`Transaction is mined; backend verification is ${recorded.verification.status}. It remains in the outbox.`);
          return;
        }
      } catch (error: unknown) {
        toast.error(`Transaction ${shortAddress(result.txHash)} is mined, but backend sync failed. Use the outbox retry; do not send it again. ${error instanceof Error ? error.message : ''}`);
        return;
      }
      clearPendingOperation(result.txHash);
      await loadPools();
      toast.success('Transaction confirmed and recorded by backend');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Admin transaction failed');
    } finally {
      setOperationLoading('');
    }
  };

  const changeFee = async () => {
    const feePercent = normalizePositiveInteger(feeValue, 'Fee percent', true);
    if (Number(feePercent) > 100) throw new Error('Fee percent cannot exceed 100');
    await runPoolOperation('fee', 'update_pool_fee_percent', { feePercent }, (onSubmitted) => (
      updatePoolFee({ poolId: selectedPool!.poolId!, feePercent, onSubmitted })
    ));
  };

  const changeMinInvestment = async () => {
    const minInvestment = parseTokenAmount(minInvestmentValue, investTokenDecimals);
    await runPoolOperation(
      'min',
      'update_pool_min_investment',
      { minInvestment },
      (onSubmitted) => updatePoolMinInvestment({ poolId: selectedPool!.poolId!, minInvestment, onSubmitted }),
    );
  };

  const depositTokens = async () => {
    if (!selectedPool || selectedPool.onchainState?.closed !== true) {
      throw new Error('Project-token settlement is available only after the verified pool is closed');
    }
    if (selectedPool.onchainState.claimEnabled !== false) {
      throw new Error(selectedPool.onchainState.claimEnabled
        ? 'Claims are already enabled; project tokens cannot be deposited again'
        : 'Verified claim state is unavailable; sync the pool before depositing settlement tokens');
    }
    if (!isAddress(projectTokenAddress)) throw new Error('Project token address is invalid');
    const metadata = await readErc20Metadata({ token: projectTokenAddress.trim() });
    setProjectTokenMetadata(metadata);
    const amount = parseTokenAmount(projectTokenAmount, metadata.decimals);
    await runPoolOperation(
      'deposit',
      'deposit_project_tokens',
      {
        projectToken: metadata.address,
        amount,
        decimals: metadata.decimals,
        symbol: metadata.symbol,
      },
      (onSubmitted) => depositProjectTokens({
        poolId: selectedPool!.poolId!,
        projectToken: metadata.address,
        amount,
        onSubmitted,
      }),
    );
  };

  const loadProjectTokenMetadata = async () => {
    if (!isAddress(projectTokenAddress)) throw new Error('Project token address is invalid');
    setTokenMetadataLoading(true);
    try {
      const metadata = await readErc20Metadata({ token: projectTokenAddress.trim() });
      setProjectTokenMetadata(metadata);
      toast.success(`Verified ${metadata.symbol} with ${metadata.decimals} decimals`);
    } finally {
      setTokenMetadataLoading(false);
    }
  };

  const closePool = async () => {
    if (!window.confirm('Close this pool if the smart-contract completion conditions are met?')) return;
    await runPoolOperation('close', 'close_pool', {}, (onSubmitted) => (
      closePoolIfFinished({ poolId: selectedPool!.poolId!, onSubmitted })
    ));
  };

  const unstakeAll = async () => {
    if (!window.confirm('Mass-unstake every user NFT from this pool? This can be expensive and irreversible.')) return;
    await runPoolOperation('unstake', 'admin_unstake_all_pool_users', {}, (onSubmitted) => (
      adminUnstakeAllPoolUsers({ poolId: selectedPool!.poolId!, onSubmitted })
    ));
  };

  const syncSelectedPoolContract = async () => {
    if (!selectedPool) throw new Error('Select a Launchpad pool first');
    if (mutationBusy) throw new Error('Wait for the current Launchpad mutation to finish');
    setOperationLoading('sync-contract');
    try {
      const synced = await syncLaunchpadPoolContract(selectedPool.id);
      setPools((current) => current.map((pool) => (pool.id === synced.id ? synced : pool)));
      setSelectedPoolId(synced.id);
      toast.success('Pool contract state synchronized from the configured backend RPC');
    } finally {
      setOperationLoading('');
    }
  };

  const saveLaunchDetails = async () => {
    if (!selectedPool) throw new Error('Select a Launchpad pool first');
    if (!['active', 'closed'].includes(selectedPool.status)) {
      throw new Error('Launch details editing is available after the pool create transaction is confirmed');
    }
    const issues = validateLaunchpadDetails(editDetailsForm, selectedPool.canonicalProject);
    if (issues.length) throw new Error(issues[0]);
    setDetailsSaving(true);
    try {
      const saved = await updateLaunchpadDetails(selectedPool.id, {
        expectedRevision: selectedPool.revision,
        slug: editDetailsForm.slug.trim(),
        launchDetails: launchpadDetailsFromForm(editDetailsForm),
      });
      markLaunchpadMediaPersisted(launchpadMediaUrlsFromForm(editDetailsForm));
      await retryLaunchpadMediaCleanup();
      setPools((current) => current.map((pool) => (pool.id === saved.id ? saved : pool)));
      setSelectedPoolId(saved.id);
      setEditDetailsForm(launchpadDetailsToForm(saved.slug, saved.launchDetails));
      const readinessIssues = launchpadReadinessMessages(saved.readiness);
      if (saved.readiness?.ready) {
        toast.success('Launch details saved and ready for publication');
      } else if (readinessIssues.length) {
        toast.warning(`Launch details saved. Not ready to publish: ${readinessIssues.join(' ')}`);
      } else {
        toast.success('Launch details saved');
      }
    } finally {
      setDetailsSaving(false);
    }
  };

  const changePublication = async (publicationStatus: 'draft' | 'published' | 'hidden') => {
    if (!selectedPool) return;
    setOperationLoading('publication');
    try {
      if (publicationStatus === 'published') {
        const [latestPool, readiness] = await Promise.all([
          fetchLaunchpadPool(selectedPool.id),
          fetchLaunchpadReadiness(selectedPool.id),
        ]);
        const latestPoolWithReadiness = { ...latestPool, readiness };
        setPools((current) => current.map((pool) => (
          pool.id === latestPool.id ? latestPoolWithReadiness : pool
        )));
        const readinessIssues = launchpadReadinessMessages(readiness);
        if (!readiness.ready) {
          throw new Error(`Launch is not ready to publish: ${readinessIssues.join(' ') || 'backend readiness checks failed'}`);
        }
      }
      await updateLaunchpadPublication(selectedPool.id, publicationStatus);
      await loadPools();
      toast.success(`Publication status changed to ${publicationStatus}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update publication');
    } finally {
      setOperationLoading('');
    }
  };

  const updatePlacementForm = (
    surface: LaunchpadPlacementSurface,
    patch: Partial<PlacementForm>,
  ) => {
    setPlacementForms((current) => ({
      ...current,
      [surface]: { ...current[surface], ...patch },
    }));
  };

  const savePlacement = async (surface: LaunchpadPlacementSurface) => {
    if (!selectedPool) throw new Error('Select a Launchpad pool first');
    const formValue = placementForms[surface];
    const desktopUrl = formValue.desktopUrl.trim();
    if (!desktopUrl) {
      throw new Error('Desktop banner URL is required for an explicit page placement');
    }
    if ([desktopUrl, formValue.mobileUrl, formValue.linkUrl].some((value) => value.length > 2_048)) {
      throw new Error('Placement banner and click URLs must not exceed 2048 characters');
    }
    if (formValue.alt.length > 500) {
      throw new Error('Placement alt text must not exceed 500 characters');
    }
    if (!isLaunchpadUrl(desktopUrl) || !isLaunchpadUrl(formValue.mobileUrl) || !isLaunchpadUrl(formValue.linkUrl)) {
      throw new Error('Placement banner and click URLs must be valid http(s) URLs or stored upload paths');
    }
    const sortOrder = Number(normalizePositiveInteger(formValue.sortOrder, 'Sort order', true));
    if (sortOrder > 1_000_000) {
      throw new Error('Sort order must be between 0 and 1000000');
    }
    const banner = {
      desktopUrl,
      ...(formValue.mobileUrl.trim() ? { mobileUrl: formValue.mobileUrl.trim() } : {}),
      ...(formValue.linkUrl.trim() ? { linkUrl: formValue.linkUrl.trim() } : {}),
      ...(formValue.alt.trim() ? { alt: formValue.alt.trim() } : {}),
    };
    const existing = placements.find((placement) => placement.surface === surface);
    setPlacementSaving(surface);
    try {
      if (existing) {
        await updateLaunchpadPlacement(existing.id, {
          enabled: formValue.enabled,
          featured: formValue.featured,
          ad: formValue.ad,
          sortOrder,
          banner,
        });
      } else {
        await upsertLaunchpadPlacement({
          launchpadPoolId: selectedPool.id,
          surface,
          enabled: formValue.enabled,
          featured: formValue.featured,
          ad: formValue.ad,
          sortOrder,
          banner,
        });
      }
      markLaunchpadMediaPersisted([desktopUrl, formValue.mobileUrl.trim()]);
      await retryLaunchpadMediaCleanup();
      await loadPlacements(selectedPool.id);
      const path = PLACEMENT_SURFACES.find((option) => option.value === surface)?.path || surface;
      toast.success(`Placement for ${path} saved`);
    } finally {
      setPlacementSaving('');
    }
  };

  const removePlacement = async (surface: LaunchpadPlacementSurface) => {
    if (!selectedPool) return;
    const existing = placements.find((placement) => placement.surface === surface);
    if (!existing) return;
    const path = PLACEMENT_SURFACES.find((option) => option.value === surface)?.path || surface;
    if (!window.confirm(`Remove this project from ${path}? This deletes only the page placement, not the project or pool.`)) {
      return;
    }
    setPlacementSaving('delete');
    try {
      queueLaunchpadManagedMediaCleanup([
        existing.banner.desktopUrl || '',
        existing.banner.mobileUrl || '',
      ]);
      await deleteLaunchpadPlacement(existing.id);
      await retryLaunchpadMediaCleanup();
      await loadPlacements(selectedPool.id);
      toast.success(`Placement for ${path} removed`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove page placement');
    } finally {
      setPlacementSaving('');
    }
  };

  const runGlobalAction = async () => {
    if (mutationBusy) throw new Error('Wait for the current Launchpad mutation to finish');
    if (deploymentIssue) throw new Error(deploymentIssue);
    if (!canManageGlobal) throw new Error('Only the Launchpad owner can change global settings');
    if (!isAddress(globalAddress)) throw new Error('Enter a valid EVM address');
    if (globalConfirmation !== 'CONFIRM') throw new Error('Type CONFIRM to execute this global change');
    const address = globalAddress.trim();
    const calls: Record<GlobalAction, (onSubmitted: (submission: { txHash: string }) => void) => Promise<{ txHash: string; submittedTxHash?: string }>> = {
      'add_admin': (onSubmitted) => addAdmin({ account: address, onSubmitted }),
      'remove_admin': (onSubmitted) => removeAdmin({ account: address, onSubmitted }),
      'set_investment_receiver': (onSubmitted) => setInvestmentReceiver({ receiver: address, onSubmitted }),
      'set_fee_receiver': (onSubmitted) => setFeeReceiver({ receiver: address, onSubmitted }),
      'transfer_ownership': (onSubmitted) => transferOwnership({ newOwner: address, onSubmitted }),
    };
    setOperationLoading('global');
    const pendingFor = (txHash: string): PendingOperation => ({
      scope: 'global',
      type: globalAction,
      txHash,
      params: { address },
      createdAt: new Date().toISOString(),
    });
    let submittedTxHash = '';
    try {
      const result = await calls[globalAction](({ txHash }) => {
        submittedTxHash = txHash;
        queuePendingOperation(pendingFor(txHash));
      });
      if (submittedTxHash && submittedTxHash.toLowerCase() !== result.txHash.toLowerCase()) {
        clearPendingOperation(submittedTxHash);
      }
      queuePendingOperation(pendingFor(result.txHash));
      try {
        const recorded = await recordLaunchpadGlobalOperation({
          type: globalAction,
          txHash: result.txHash,
          params: { address },
        });
        if (recorded.verification.status !== 'confirmed') {
          toast.info(`Transaction is mined; backend verification is ${recorded.verification.status}. It remains in the outbox.`);
          return;
        }
      } catch (error: unknown) {
        toast.error(`Transaction ${shortAddress(result.txHash)} is mined, but backend sync failed. Use the outbox retry; do not send it again. ${error instanceof Error ? error.message : ''}`);
        return;
      }
      clearPendingOperation(result.txHash);
      setWallet(await getLaunchpadAdminContext());
      setGlobalConfirmation('');
      toast.success('Global Launchpad change confirmed and recorded');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Global Launchpad change failed');
    } finally {
      setOperationLoading('');
    }
  };

  const retryPendingOperation = async (pending: PendingOperation) => {
    if (mutationBusy) return;
    setOperationLoading(`retry:${pending.txHash}`);
    try {
      if (pending.scope === 'pool') {
        if (!pending.poolBackendId) throw new Error('Outbox item has no backend pool ID');
        const recorded = await recordLaunchpadOperation(pending.poolBackendId, {
          type: pending.type as LaunchpadPoolOperationType,
          txHash: pending.txHash,
          params: pending.params,
        });
        if (recorded.verification.status !== 'confirmed') {
          toast.info(`Backend verification is still ${recorded.verification.status}; outbox item retained.`);
          return;
        }
      } else {
        const recorded = await recordLaunchpadGlobalOperation({
          type: pending.type as LaunchpadGlobalOperationType,
          txHash: pending.txHash,
          params: pending.params,
        });
        if (recorded.verification.status !== 'confirmed') {
          toast.info(`Backend verification is still ${recorded.verification.status}; outbox item retained.`);
          return;
        }
      }
      clearPendingOperation(pending.txHash);
      await loadPools();
      toast.success('Mined transaction was reconciled without sending a new transaction');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Outbox reconciliation failed');
    } finally {
      setOperationLoading('');
    }
  };

  const renderOperationOutbox = () => {
    if (pendingOperations.length === 0) return null;
    return (
      <div className={classes.panel} style={{ marginBottom: 18 }}>
        <div className={classes.panelHeader}>
          <div>
            <h2 className={classes.panelTitle}>Mined transactions awaiting backend sync</h2>
            <p className={classes.panelHint}>Retry only the backend verification. Do not send these smart-contract calls again.</p>
          </div>
          <span className={`${classes.status} ${classes.statusPending}`}>{pendingOperations.length} pending</span>
        </div>
        <div className={classes.poolList}>
          {pendingOperations.map((pending) => (
            <div className={classes.poolRow} key={`${pending.scope}:${pending.txHash}`}>
              <div>
                <div className={classes.projectName}>{pending.type.replace(/_/g, ' ')}</div>
                <div className={classes.projectMeta}>{pending.scope} · {new Date(pending.createdAt).toLocaleString()}</div>
              </div>
              <div className={classes.address}>{shortAddress(pending.txHash)}</div>
              <div>
                {config?.explorerUrl && (
                  <a className={classes.link} href={`${config.explorerUrl}/tx/${pending.txHash}`} target="_blank" rel="noreferrer">Explorer</a>
                )}
              </div>
              <button
                className={classes.secondaryButton}
                type="button"
                disabled={mutationBusy}
                onClick={() => retryPendingOperation(pending)}
              >
                Retry backend sync
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCreateProgress = () => (
    <div className={classes.panelBody}>
      <div className={classes.stepList}>
        {[
          ['Save backend draft', 'Canonical project and normalized pool arguments are persisted first.'],
          ['Sign transaction', 'Wallet simulates and sends createPool on BSC Testnet.'],
          ['Persist tx hash', 'Predicted pool ID and tx hash are saved immediately after broadcast.'],
          ['Verify receipt', 'Backend verifies PoolCreated from the expected Launchpad address.'],
          ['Ready to publish', 'The event pool ID is authoritative; prediction is diagnostic only.'],
        ].map(([title, hint], index) => {
          const step = index + 1;
          const stateClass = step < currentStep
            ? classes.doneStep
            : step === currentStep
              ? classes.activeStep
              : '';
          return (
            <div className={`${classes.step} ${stateClass}`} key={title}>
              <span className={classes.stepNumber}>{step < currentStep ? '✓' : step}</span>
              <div><strong>{title}</strong><br />{hint}</div>
            </div>
          );
        })}
      </div>
      {submitted && (
        <div className={classes.resultBox}>
          <div><strong>Draft:</strong> {submitted.draftId}</div>
          <div><strong>Predicted ID:</strong> {submitted.predictedPoolId}</div>
          {submitted.poolId && <div><strong>Confirmed ID:</strong> {submitted.poolId}</div>}
          <div className={classes.address}><strong>Tx:</strong> {submitted.txHash}</div>
          {submitted.cancellationTxHash && (
            <div className={classes.address}><strong>Mined cancellation:</strong> {submitted.cancellationTxHash}</div>
          )}
          {config?.explorerUrl && (
            <a
              className={classes.link}
              href={`${config.explorerUrl}/tx/${submitted.txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Open transaction in explorer
            </a>
          )}
          {config?.explorerUrl && submitted.cancellationTxHash && (
            <a
              className={classes.link}
              href={`${config.explorerUrl}/tx/${submitted.cancellationTxHash}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: 10 }}
            >
              Open cancellation in explorer
            </a>
          )}
          {createVerification && (
            <div className={`${classes.notice} ${createVerification.status === 'confirmed' ? '' : classes.warning}`} style={{ marginTop: 10 }}>
              <div><strong>Backend verification:</strong> {createVerification.status}</div>
              {createVerification.reason && <div><strong>Reason:</strong> {createVerification.reason}</div>}
              {createVerification.failureKind && <div><strong>Failure kind:</strong> {createVerification.failureKind}</div>}
            </div>
          )}
          {phase !== 'complete' && (
            <div style={{ marginTop: 10 }}>
              <button className={classes.secondaryButton} type="button" onClick={retryReconcile} disabled={phase === 'confirming'}>
                Retry backend reconciliation
              </button>
            </div>
          )}
          {canResetCreateFailure && submittedPool && (
            <div style={{ marginTop: 10 }}>
              <button className={`${classes.secondaryButton} ${classes.dangerButton}`} type="button" onClick={() => resetVerifiedFailedCreate(submittedPool, createResetSignal)}>
                Reset backend-verified failed create
              </button>
            </div>
          )}
          {phase === 'failed' && !canResetCreateFailure && (
            <div className={`${classes.notice} ${classes.warning}`} style={{ marginTop: 10 }}>
              Recovery is locked because this may be a successful transaction with a backend configuration or data mismatch.
              Retry reconciliation; do not clear recovery and do not send another create transaction.
            </div>
          )}
        </div>
      )}
      {!isCreating && phase !== 'failed' && !hasUnresolvedCreate && (
        <div style={{ marginTop: 14 }}>
          <button className={classes.secondaryButton} type="button" onClick={resetDraftAttempt}>
            Start a fresh draft attempt
          </button>
        </div>
      )}
    </div>
  );

  const renderProjectPicker = () => (
    <div className={classes.panel}>
      <div className={classes.panelHeader}>
        <div>
          <h2 className={classes.panelTitle}>1. Canonical project</h2>
          <p className={classes.panelHint}>Reuse the shared project identity and media whenever possible.</p>
        </div>
      </div>
      <div className={classes.panelBody}>
        <div className={classes.modeToggle}>
          <button
            type="button"
            className={`${classes.modeButton} ${projectMode === 'existing' ? classes.activeMode : ''}`}
            onClick={() => setProjectMode('existing')}
          >
            Existing project
          </button>
          <button
            type="button"
            className={`${classes.modeButton} ${projectMode === 'new' ? classes.activeMode : ''}`}
            onClick={() => setProjectMode('new')}
          >
            New canonical
          </button>
        </div>

        {projectMode === 'existing' ? (
          <>
            <input
              className={classes.search}
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
              placeholder="Search name, symbol or slug"
            />
            <div className={classes.projectList}>
              {projects.map((project) => (
                <button
                  type="button"
                  className={`${classes.projectCard} ${selectedProjectId === project.id ? classes.selectedProject : ''}`}
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {project.logo ? (
                    <img className={classes.logo} src={loader(project.logo)} alt="" />
                  ) : (
                    <span className={classes.logoFallback}>{project.name.slice(0, 1).toUpperCase()}</span>
                  )}
                  <span>
                    <span className={classes.projectName}>{project.name}</span>
                    <span className={classes.projectMeta}>
                      {project.symbol || project.slug || shortAddress(project.id)}
                      {project.createdForLaunchpad ? ' · launch-origin' : ''}
                    </span>
                  </span>
                  {selectedProjectId === project.id && <span className={classes.check}>✓</span>}
                </button>
              ))}
              {!projectsLoading && projects.length === 0 && (
                <div className={classes.empty}>No canonical projects match this search. Switch to “New canonical” to create one.</div>
              )}
              {projectsLoading && <div className={classes.empty}>Loading projects…</div>}
            </div>
          </>
        ) : (
          <div className={classes.formGrid}>
            <label className={`${classes.field} ${classes.fullWidth}`}>
              <span className={classes.label}>Project name <span className={classes.required}>*</span></span>
              <input className={classes.input} name="name" value={newProject.name} onChange={updateNewProject} />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Symbol</span>
              <input className={classes.input} name="symbol" value={newProject.symbol} onChange={updateNewProject} placeholder="ABC" />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Slug</span>
              <input className={classes.input} name="slug" value={newProject.slug} onChange={updateNewProject} placeholder="project-name" />
            </label>
            <div className={classes.fullWidth}>
              <LaunchpadAssetField
                label="Canonical project logo"
                value={newProject.logo}
                onChange={(logo) => setNewProject((previous) => ({ ...previous, logo }))}
              />
            </div>
            <label className={`${classes.field} ${classes.fullWidth}`}>
              <span className={classes.label}>Website</span>
              <input className={classes.input} name="website" value={newProject.website} onChange={updateNewProject} placeholder="https://…" />
            </label>
            <label className={`${classes.field} ${classes.fullWidth}`}>
              <span className={classes.label}>Short description</span>
              <textarea className={`${classes.input} ${classes.textarea}`} name="description" value={newProject.description} onChange={updateNewProject} />
              <span className={classes.helper}>Backend marks this canonical entity as created for Launchpad.</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className={classes.panel}>
      <div className={classes.panelHeader}>
        <div>
          <h2 className={classes.panelTitle}>2. Pool parameters</h2>
          <p className={classes.panelHint}>Human-readable values are converted to exact on-chain integers before the draft is saved.</p>
        </div>
      </div>
      <div className={classes.panelBody}>
        <div className={classes.formGrid}>
          <label className={`${classes.field} ${classes.fullWidth}`}>
            <span className={classes.label}>Investment token <span className={classes.required}>*</span></span>
            <input className={classes.input} name="investToken" value={form.investToken} disabled readOnly />
            <span className={classes.helper}>Configured BSC testnet {investTokenSymbol}; {investTokenDecimals} decimals. Payment token is deployment-controlled.</span>
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Target / hard cap ({investTokenSymbol}) <span className={classes.required}>*</span></span>
            <input className={classes.input} name="targetAmount" value={form.targetAmount} onChange={updateForm} inputMode="decimal" placeholder="100000" />
            <span className={classes.helper}>Hard cap, not a minimum-success threshold. Under-target pools can still close.</span>
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Minimum investment ({investTokenSymbol}) <span className={classes.required}>*</span></span>
            <input className={classes.input} name="minInvestment" value={form.minInvestment} onChange={updateForm} inputMode="decimal" placeholder="100" />
            <span className={classes.helper}>Always explicit; contract raw default is unsafe for 18 decimals.</span>
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Green seats <span className={classes.required}>*</span></span>
            <input className={classes.input} name="greenSeats" value={form.greenSeats} onChange={updateForm} inputMode="numeric" placeholder="100" />
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Yellow seats</span>
            <input className={classes.input} name="yellowSeats" value={form.yellowSeats} onChange={updateForm} inputMode="numeric" />
            <span className={classes.helper}>Zero disables the Yellow allocation.</span>
          </label>

          <div className={classes.sectionHeading}>Schedule · browser local time</div>
          <label className={classes.field}>
            <span className={classes.label}>NFT staking starts <span className={classes.required}>*</span></span>
            <input className={classes.input} type="datetime-local" name="stakeStart" value={form.stakeStart} onChange={updateForm} />
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Green phase starts <span className={classes.required}>*</span></span>
            <input className={classes.input} type="datetime-local" name="greenStart" value={form.greenStart} onChange={updateForm} />
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Green phase ends <span className={classes.required}>*</span></span>
            <input className={classes.input} type="datetime-local" name="greenEnd" value={form.greenEnd} onChange={updateForm} />
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Yellow slot duration (minutes) <span className={classes.required}>*</span></span>
            <input className={classes.input} name="yellowSlotDurationMinutes" value={form.yellowSlotDurationMinutes} onChange={updateForm} inputMode="numeric" />
          </label>

          <div className={classes.sectionHeading}>Economics</div>
          <label className={classes.field}>
            <span className={classes.label}>Pool fee (whole %) <span className={classes.required}>*</span></span>
            <input className={classes.input} name="feePercent" value={form.feePercent} onChange={updateForm} inputMode="numeric" min="0" max="100" />
            <span className={classes.helper}>Integer from 0 to 100; fractional percentages are not supported.</span>
          </label>
          <div className={classes.field}>
            <span className={classes.label}>Receivers</span>
            <div className={classes.detail}>
              <div>Investment: <span className={classes.address}>{shortAddress(wallet?.investmentReceiver)}</span></div>
              <div>Fee: <span className={classes.address}>{shortAddress(wallet?.feeReceiver)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreate = () => (
    <>
      <div className={`${classes.notice} ${classes.warning}`}>
        `targetAmount` is a hard cap, not a soft cap or minimum-success threshold. Under-target pools still close; claim/refund output must come from verified contract state.
      </div>
      {hasUnresolvedCreate && (
        <div className={`${classes.notice} ${classes.warning}`}>
          <strong>New create transactions are locked.</strong> {unresolvedCreatePools.length} backend {unresolvedCreatePools.length === 1 ? 'pool has' : 'pools have'} an existing unresolved transaction.
          Open Pools &amp; actions and use “Reconcile existing on-chain transaction”. Sending another transaction may create a duplicate pool.
        </div>
      )}
      <LaunchpadDetailsWizard
        mode="create"
        value={createDetailsForm}
        onChange={setCreateDetailsForm}
        canonicalProject={selectedCanonicalProject}
        projectPicker={renderProjectPicker()}
        poolStep={renderCreateForm()}
        poolPreview={(
          <div className={classes.detailGrid}>
            <div className={classes.detail}><div className={classes.detailLabel}>Payment token</div>{form.investToken || '-'}</div>
            <div className={classes.detail}><div className={classes.detailLabel}>Hard cap</div>{form.targetAmount || '-'} {investTokenSymbol}</div>
            <div className={classes.detail}><div className={classes.detailLabel}>Minimum</div>{form.minInvestment || '-'} {investTokenSymbol}</div>
            <div className={classes.detail}><div className={classes.detailLabel}>Seats</div>{form.greenSeats || '0'} green · {form.yellowSeats || '0'} yellow</div>
          </div>
        )}
        primaryLabel="Create backend draft & sign pool"
        primaryBusy={isCreating}
        formDisabled={isCreating}
        primaryDisabled={!canManagePools || Boolean(deploymentIssue) || mutationBusy || phase === 'failed' || hasUnresolvedCreate || loading}
        validatePoolStep={() => {
          try {
            normalizedPoolParams();
            return [];
          } catch (error: unknown) {
            return [error instanceof Error ? error.message : 'Pool parameters are invalid'];
          }
        }}
        onPrimaryAction={createLaunch}
      />
      <div className={classes.panel} style={{ marginTop: 18 }}>
        <div className={classes.panelHeader}>
          <div><h2 className={classes.panelTitle}>Creation recovery</h2><p className={classes.panelHint}>The existing backend/chain state machine remains authoritative after wallet submission.</p></div>
        </div>
        {renderCreateProgress()}
      </div>
    </>
  );

  const renderPoolOperations = () => {
    if (!selectedPool) return <div className={classes.empty}>Select a pool to manage it.</div>;
    const params = selectedPool.createParams;
    const createTxHash = launchpadCreateTransactionHash(selectedPool);
    const selectedVerificationReason = submitted?.draftId === selectedPool.id
      ? createVerification?.reason
      : selectedPool.createTransaction?.verificationError || selectedPool.lastError;
    const settlementClosed = selectedPool.onchainState?.closed === true;
    const settlementClaimEnabled = selectedPool.onchainState?.claimEnabled;
    const canDepositSettlement = settlementClosed && settlementClaimEnabled === false;
    const configuredInvestToken = config?.investTokenAddress || params?.investToken || '';
    const isPaymentTokenSettlement = isAddress(projectTokenAddress)
      && projectTokenAddress.trim().toLowerCase() === configuredInvestToken.toLowerCase();
    const raisedAmount = String(selectedPool.onchainState?.raisedAmount || '');
    const raisedAmountLabel = /^\d+$/.test(raisedAmount)
      ? `${formatTokenAmount(raisedAmount, investTokenDecimals)} ${investTokenSymbol}`
      : '';
    const resettableCreate = isExplicitlyResettableCreate(selectedPool.createTransaction);
    return (
      <div className={classes.panelBody}>
        <div className={classes.detailGrid}>
          <div className={classes.detail}><div className={classes.detailLabel}>Project</div>{poolProjectName(selectedPool)}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>On-chain pool ID</div>{selectedPool.poolId || 'Not confirmed'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Status</div><span className={poolStatusClass(classes, selectedPool.status)}>{selectedPool.status}</span></div>
          <div className={classes.detail}><div className={classes.detailLabel}>Publication</div>{selectedPool.publicationStatus || 'draft'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Target</div>{params ? `${formatTokenAmount(params.targetAmount, investTokenDecimals)} ${investTokenSymbol}` : '-'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Minimum</div>{params ? `${formatTokenAmount(params.minInvestment, investTokenDecimals)} ${investTokenSymbol}` : '-'}</div>
        </div>

        <div className={classes.headerActions} style={{ marginTop: 12 }}>
          <button
            className={classes.secondaryButton}
            type="button"
            disabled={!selectedPool.poolId || mutationBusy}
            onClick={() => syncSelectedPoolContract().catch((error: unknown) => {
              toast.error(error instanceof Error ? error.message : 'Contract sync failed');
            })}
          >{operationLoading === 'sync-contract' ? 'Syncing contract state…' : 'Sync contract state'}</button>
        </div>

        {!selectedPool.poolId && (
          <div className={`${classes.notice} ${classes.warning}`}>
            Pool has no verified on-chain ID. Reconcile the create transaction before running smart-contract actions.
            {createTxHash && (
              <>
                <div className={classes.address} style={{ marginTop: 8 }}><strong>Existing tx:</strong> {createTxHash}</div>
                {config?.explorerUrl && (
                  <a className={classes.link} href={`${config.explorerUrl}/tx/${createTxHash}`} target="_blank" rel="noreferrer">
                    Open existing transaction in explorer
                  </a>
                )}
              </>
            )}
            {selectedVerificationReason && (
              <div style={{ marginTop: 8 }}><strong>Backend verification reason:</strong> {selectedVerificationReason}</div>
            )}
            <div style={{ marginTop: 8 }}>
              <button
                className={classes.secondaryButton}
                type="button"
                onClick={() => reconcileExistingPoolCreate(selectedPool)}
                disabled={Boolean(operationLoading) || !createTxHash}
              >Reconcile existing on-chain transaction</button>
              {resettableCreate && (
                <button
                  className={`${classes.secondaryButton} ${classes.dangerButton}`}
                  style={{ marginLeft: 8 }}
                  type="button"
                  onClick={() => resetVerifiedFailedCreate(selectedPool, selectedPool.createTransaction)}
                  disabled={Boolean(operationLoading)}
                >Reset verified failed create</button>
              )}
            </div>
            {!createTxHash && <div className={classes.helper}>No create transaction hash is stored for this draft.</div>}
          </div>
        )}

        <div className={classes.operationCard}>
          <h3 className={classes.operationTitle}>Publication</h3>
          {selectedPool.readiness && (
            <div className={`${classes.notice} ${selectedPool.readiness.ready ? '' : classes.warning}`}>
              <strong>{selectedPool.readiness.ready ? 'Ready to publish.' : 'Publication is blocked by backend readiness checks.'}</strong>
              {!selectedPool.readiness.ready && launchpadReadinessMessages(selectedPool.readiness).map((issue) => (
                <div key={issue}>· {issue}</div>
              ))}
            </div>
          )}
          <div className={classes.headerActions}>
            {(['draft', 'published', 'hidden'] as const).map((status) => (
              <button
                key={status}
                className={classes.secondaryButton}
                type="button"
                disabled={mutationBusy || selectedPool.publicationStatus === status}
                onClick={() => changePublication(status)}
              >{status}</button>
            ))}
          </div>
        </div>

        <div className={classes.operationCard}>
          <h3 className={classes.operationTitle}>Update pool fee</h3>
          <div className={classes.operationFields}>
            <label className={classes.field}><span className={classes.label}>Whole percent (0–100)</span><input className={classes.input} value={feeValue} onChange={(event) => setFeeValue(event.target.value)} /></label>
            <button className={classes.secondaryButton} disabled={!canManagePools || !selectedPool.poolId || mutationBusy} onClick={() => changeFee().catch((error) => toast.error(error.message))}>Update fee</button>
          </div>
        </div>

        <div className={classes.operationCard}>
          <h3 className={classes.operationTitle}>Update minimum investment</h3>
          <div className={classes.operationFields}>
            <label className={classes.field}><span className={classes.label}>Amount ({investTokenSymbol}, {investTokenDecimals} decimals)</span><input className={classes.input} value={minInvestmentValue} onChange={(event) => setMinInvestmentValue(event.target.value)} /></label>
            <button className={classes.secondaryButton} disabled={!canManagePools || !selectedPool.poolId || mutationBusy} onClick={() => changeMinInvestment().catch((error) => toast.error(error.message))}>Update minimum</button>
          </div>
        </div>

        <div className={classes.operationCard}>
          <h3 className={classes.operationTitle}>Deposit project tokens</h3>
          <div className={`${classes.notice} ${!canDepositSettlement ? classes.warning : ''}`}>
            {!settlementClosed
              ? 'Settlement unlocks only after backend sync confirms that the pool is closed.'
              : settlementClaimEnabled === true
                ? 'Claims are already enabled. The contract will reject another project-token deposit.'
                : settlementClaimEnabled === false
                  ? 'Pool is closed and ready for one settlement-token deposit.'
                  : 'Claim state is not verified. Sync the pool before depositing settlement tokens.'}
          </div>
          {isPaymentTokenSettlement && (
            <div className={`${classes.notice} ${classes.warning}`}>
              <strong>USDT refund settlement.</strong> Depositing the configured payment token means the ordinary Claim action returns USDT; there is no separate refund transaction.
            </div>
          )}
          <div className={`${classes.operationFields} ${classes.tripleOperationFields}`}>
            <label className={classes.field}><span className={classes.label}>Token address</span><input className={classes.input} value={projectTokenAddress} onChange={(event) => { setProjectTokenAddress(event.target.value); setProjectTokenMetadata(null); }} placeholder="0x…" /></label>
            <label className={classes.field}><span className={classes.label}>On-chain metadata</span><input className={classes.input} disabled value={projectTokenMetadata ? `${projectTokenMetadata.symbol} · ${projectTokenMetadata.decimals} decimals` : 'Not verified'} /></label>
            <button className={classes.secondaryButton} disabled={tokenMetadataLoading} onClick={() => loadProjectTokenMetadata().catch((error) => toast.error(error.message))}>{tokenMetadataLoading ? 'Reading…' : 'Verify token'}</button>
            <label className={classes.field}><span className={classes.label}>Human amount {projectTokenMetadata ? `(${projectTokenMetadata.symbol})` : ''}</span><input className={classes.input} value={projectTokenAmount} onChange={(event) => setProjectTokenAmount(event.target.value)} /></label>
            <span className={classes.helper}>
              Enter the total distribution volume. For a full gross USDT refund this is normally the pool raised amount{raisedAmountLabel ? ` (${raisedAmountLabel})` : ''}; verify the intended settlement policy. The admin never auto-fills or substitutes this amount. Token decimals are read again immediately before signing.
            </span>
            <button className={classes.secondaryButton} disabled={!canManagePools || !selectedPool.poolId || !canDepositSettlement || mutationBusy} onClick={() => depositTokens().catch((error) => toast.error(error.message))}>Approve & deposit</button>
          </div>
        </div>

        <div className={classes.operationCard}>
          <h3 className={classes.operationTitle}>Lifecycle actions</h3>
          <div className={classes.headerActions}>
            <button className={classes.secondaryButton} disabled={!canManagePools || !selectedPool.poolId || mutationBusy} onClick={closePool}>Close if finished</button>
            <button className={`${classes.secondaryButton} ${classes.dangerButton}`} disabled={!canManagePools || !selectedPool.poolId || mutationBusy} onClick={unstakeAll}>Mass-unstake pool users</button>
          </div>
        </div>

        <div className={classes.operationCard}>
          <h3 className={classes.operationTitle}>Global Launchpad settings · high risk</h3>
          <p className={classes.panelHint}>Owner only. These calls affect the whole contract and are recorded in the global Launchpad audit log.</p>
          <div className={classes.formGrid} style={{ marginTop: 10 }}>
            <label className={classes.field}>
              <span className={classes.label}>Action</span>
              <select className={classes.input} value={globalAction} onChange={(event) => setGlobalAction(event.target.value as GlobalAction)}>
                <option value="add_admin">Add admin</option>
                <option value="remove_admin">Remove admin</option>
                <option value="set_investment_receiver">Set investment receiver</option>
                <option value="set_fee_receiver">Set fee receiver</option>
                <option value="transfer_ownership">Transfer ownership</option>
              </select>
            </label>
            <label className={classes.field}>
              <span className={classes.label}>New address</span>
              <input className={classes.input} value={globalAddress} onChange={(event) => setGlobalAddress(event.target.value)} placeholder="0x…" />
            </label>
            <label className={classes.field}>
              <span className={classes.label}>Type CONFIRM</span>
              <input className={classes.input} value={globalConfirmation} onChange={(event) => setGlobalConfirmation(event.target.value)} />
            </label>
            <div className={classes.field}>
              <span className={classes.label}>&nbsp;</span>
              <button className={`${classes.secondaryButton} ${classes.dangerButton}`} disabled={!canManageGlobal || globalConfirmation !== 'CONFIRM' || mutationBusy} onClick={() => runGlobalAction().catch((error) => toast.error(error.message))}>Execute global change</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPools = () => (
    <div className={classes.poolsLayout}>
      <div className={classes.panel}>
        <div className={classes.panelHeader}>
          <div><h2 className={classes.panelTitle}>Launchpad pools</h2><p className={classes.panelHint}>{pools.length} backend records</p></div>
          <button className={classes.secondaryButton} type="button" onClick={() => loadPools().catch((error) => toast.error(error.message))}>Refresh</button>
        </div>
        <div className={classes.poolList}>
          {pools.map((pool) => (
            <div
              role="button"
              tabIndex={0}
              className={`${classes.poolRow} ${selectedPool?.id === pool.id ? classes.selectedPool : ''}`}
              key={pool.id}
              onClick={() => { if (!mutationBusy) setSelectedPoolId(pool.id); }}
              onKeyDown={(event) => { if (!mutationBusy && event.key === 'Enter') setSelectedPoolId(pool.id); }}
            >
              <div><div className={classes.projectName}>{poolProjectName(pool)}</div><div className={classes.projectMeta}>{shortAddress(pool.canonicalProjectId)}</div></div>
              <div><span className={poolStatusClass(classes, pool.status)}>{pool.status}</span></div>
              <div className={classes.muted}>Pool #{pool.poolId || pool.predictedPoolId || '—'}</div>
              <div className={classes.muted}>{pool.publicationStatus || 'draft'}</div>
            </div>
          ))}
          {!loading && pools.length === 0 && <div className={classes.empty}>No Launchpad pools yet. Create the first launch from a canonical project.</div>}
        </div>
      </div>
      <div className={`${classes.panel} ${classes.stickyPanel}`}>
        <div className={classes.panelHeader}>
          <div><h2 className={classes.panelTitle}>Pool administration</h2><p className={classes.panelHint}>Every smart action is mined first, then recorded and verified by backend.</p></div>
        </div>
        {renderPoolOperations()}
      </div>
    </div>
  );

  const renderDetailsEditor = () => {
    const params = selectedPool?.createParams;
    const editable = Boolean(selectedPool && ['active', 'closed'].includes(selectedPool.status));
    const poolSummary = (
      <div>
        <div className={classes.detailGrid}>
          <div className={classes.detail}><div className={classes.detailLabel}>Backend pool</div>{selectedPool?.id || '-'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>On-chain pool ID</div>{selectedPool?.poolId || 'Not confirmed'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Payment token</div><span className={classes.address}>{params?.investToken || '-'}</span></div>
          <div className={classes.detail}><div className={classes.detailLabel}>Hard cap</div>{params ? `${formatTokenAmount(params.targetAmount, investTokenDecimals)} ${investTokenSymbol}` : '-'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Minimum</div>{params ? `${formatTokenAmount(params.minInvestment, investTokenDecimals)} ${investTokenSymbol}` : '-'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Seats</div>{params ? `${params.greenSeats} green · ${params.yellowSeats} yellow` : '-'}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>NFT staking starts</div>{timestampLabel(params?.stakeStart)}</div>
          <div className={classes.detail}><div className={classes.detailLabel}>Green phase</div>{params ? `${timestampLabel(params.greenStart)} → ${timestampLabel(params.greenEnd)}` : '-'}</div>
        </div>
        <div className={classes.notice}>
          Confirmed create parameters are read-only here. Use the audited smart actions to change fee or minimum investment; other createPool arguments cannot be edited in the database.
        </div>
      </div>
    );

    return (
      <>
        <div className={classes.panel} style={{ marginBottom: 18 }}>
          <div className={classes.panelHeader}>
            <div><h2 className={classes.panelTitle}>Select a launch to edit</h2><p className={classes.panelHint}>Canonical project data stays shared; this editor saves launch-specific overrides only.</p></div>
            <button className={classes.secondaryButton} type="button" onClick={() => loadPools().catch((error) => toast.error(error.message))}>Refresh</button>
          </div>
          <div className={classes.poolList}>
            {pools.map((pool) => (
              <div
                role="button"
                tabIndex={0}
                className={`${classes.poolRow} ${selectedPool?.id === pool.id ? classes.selectedPool : ''}`}
                key={pool.id}
                onClick={() => { if (!mutationBusy) setSelectedPoolId(pool.id); }}
                onKeyDown={(event) => { if (!mutationBusy && event.key === 'Enter') setSelectedPoolId(pool.id); }}
              >
                <div><div className={classes.projectName}>{poolProjectName(pool)}</div><div className={classes.projectMeta}>/{pool.slug || 'slug-not-set'}</div></div>
                <div><span className={poolStatusClass(classes, pool.status)}>{pool.status}</span></div>
                <div className={classes.muted}>Pool #{pool.poolId || pool.predictedPoolId || '—'}</div>
                <div className={classes.muted}>{pool.readiness?.ready ? 'ready' : `${launchpadReadinessMessages(pool.readiness).length} readiness issues`}</div>
              </div>
            ))}
          </div>
        </div>
        {!selectedPool ? (
          <div className={classes.panel}><div className={classes.empty}>Select an active or closed pool.</div></div>
        ) : (
          <>
            {!editable && (
              <div className={`${classes.notice} ${classes.warning}`}>
                Finish/reconcile the create transaction before editing launch details. This prevents content changes from being confused with an unresolved smart create.
              </div>
            )}
            <LaunchpadDetailsWizard
              key={`edit-${selectedPool.id}-${selectedPool.revision || 0}`}
              mode="edit"
              value={editDetailsForm}
              onChange={setEditDetailsForm}
              canonicalProject={selectedPool.canonicalProject}
              poolStep={poolSummary}
              poolPreview={poolSummary}
              readiness={selectedPool.readiness}
              primaryLabel="Save launch details"
              primaryBusy={detailsSaving}
              primaryDisabled={!editable || mutationBusy}
              onPrimaryAction={saveLaunchDetails}
            />
          </>
        )}
      </>
    );
  };

  const renderPlacementCard = (option: PlacementSurfaceOption) => {
    const placement = placements.find((item) => item.surface === option.value);
    const formValue = placementForms[option.value];
    const busy = Boolean(placementSaving) || placementsLoading;
    return (
      <section className={classes.placementCard} key={option.value}>
        <div className={classes.placementCardHeader}>
          <div>
            <div className={classes.placementTitleRow}>
              <h3 className={classes.panelTitle}>{option.label}</h3>
              <span className={`${classes.status} ${placement ? classes.statusActive : ''}`}>
                {placement ? 'explicitly placed' : 'not placed'}
              </span>
            </div>
            <div className={classes.placementPath}>{option.path}</div>
            <p className={classes.panelHint}>{option.description}</p>
          </div>
          {formValue.desktopUrl && (
            <img
              className={classes.bannerPreview}
              src={formValue.desktopUrl}
              alt={formValue.alt || `${poolProjectName(selectedPool!)} banner preview`}
            />
          )}
        </div>

        <div className={classes.placementControls}>
          <label className={classes.checkField}>
            <input
              className={classes.checkInput}
              type="checkbox"
              checked={formValue.enabled}
              onChange={(event) => updatePlacementForm(option.value, { enabled: event.target.checked })}
            />
            <span><strong>Enabled</strong><small>Eligible for public output when the pool is active and published.</small></span>
          </label>
          <label className={classes.checkField}>
            <input
              className={classes.checkInput}
              type="checkbox"
              checked={formValue.featured}
              onChange={(event) => updatePlacementForm(option.value, { featured: event.target.checked })}
            />
            <span><strong>Featured Project</strong><small>Render this project in the Featured block on this page only.</small></span>
          </label>
          <label className={classes.checkField}>
            <input
              className={classes.checkInput}
              type="checkbox"
              checked={formValue.ad}
              onChange={(event) => updatePlacementForm(option.value, { ad: event.target.checked })}
            />
            <span><strong>Ad</strong><small>Render this project in the advertising block on this page only.</small></span>
          </label>
        </div>

        <div className={classes.formGrid}>
          <label className={classes.field}>
            <span className={classes.label}>Sort order</span>
            <input
              className={classes.input}
              inputMode="numeric"
              value={formValue.sortOrder}
              onChange={(event) => updatePlacementForm(option.value, { sortOrder: event.target.value })}
            />
            <span className={classes.helper}>Lower values are returned first within this page.</span>
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Banner alt text</span>
            <input
              className={classes.input}
              value={formValue.alt}
              onChange={(event) => updatePlacementForm(option.value, { alt: event.target.value })}
              placeholder={poolProjectName(selectedPool!)}
            />
          </label>
          <div className={classes.fullWidth}>
            <LaunchpadAssetField
              label={`${option.label} desktop placement banner *`}
              value={formValue.desktopUrl}
              onChange={(desktopUrl) => updatePlacementForm(option.value, { desktopUrl })}
            />
            <span className={classes.helper}>A placement cannot be added without its own desktop banner.</span>
          </div>
          <div className={classes.fullWidth}>
            <LaunchpadAssetField
              label={`${option.label} mobile placement banner`}
              value={formValue.mobileUrl}
              onChange={(mobileUrl) => updatePlacementForm(option.value, { mobileUrl })}
            />
            <span className={classes.helper}>Optional; desktop placement banner is the mobile fallback.</span>
          </div>
          <label className={`${classes.field} ${classes.fullWidth}`}>
            <span className={classes.label}>Banner click URL</span>
            <input
              className={classes.input}
              value={formValue.linkUrl}
              onChange={(event) => updatePlacementForm(option.value, { linkUrl: event.target.value })}
              placeholder="Optional project or launch URL"
            />
          </label>
        </div>

        <div className={classes.formActions}>
          <span className={classes.helper}>
            {placement ? `Placement ID ${shortAddress(placement.id)}` : 'Saving creates an explicit page-placement record.'}
          </span>
          <div className={classes.headerActions}>
            {placement && (
              <button
                className={`${classes.secondaryButton} ${classes.dangerButton}`}
                type="button"
                disabled={busy}
                onClick={() => removePlacement(option.value)}
              >Remove from page</button>
            )}
            <button
              className={classes.button}
              type="button"
              disabled={busy}
              onClick={() => savePlacement(option.value).catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : 'Failed to save page placement');
              })}
            >{placementSaving === option.value ? 'Saving…' : placement ? 'Save placement' : 'Add to page'}</button>
          </div>
        </div>
      </section>
    );
  };

  const renderPlacements = () => (
    <div className={classes.poolsLayout}>
      <div className={classes.panel}>
        <div className={classes.panelHeader}>
          <div><h2 className={classes.panelTitle}>Select a launch</h2><p className={classes.panelHint}>Page membership is explicit and independent for every launch.</p></div>
          <button className={classes.secondaryButton} type="button" onClick={() => loadPools().catch((error) => toast.error(error.message))}>Refresh</button>
        </div>
        <div className={classes.poolList}>
          {pools.map((pool) => (
            <div
              role="button"
              tabIndex={0}
              className={`${classes.poolRow} ${selectedPool?.id === pool.id ? classes.selectedPool : ''}`}
              key={pool.id}
              onClick={() => { if (!mutationBusy) setSelectedPoolId(pool.id); }}
              onKeyDown={(event) => { if (!mutationBusy && event.key === 'Enter') setSelectedPoolId(pool.id); }}
            >
              <div><div className={classes.projectName}>{poolProjectName(pool)}</div><div className={classes.projectMeta}>{shortAddress(pool.canonicalProjectId)}</div></div>
              <div><span className={poolStatusClass(classes, pool.status)}>{pool.status}</span></div>
              <div className={classes.muted}>Pool #{pool.poolId || pool.predictedPoolId || '—'}</div>
              <div className={classes.muted}>{pool.publicationStatus || 'draft'}</div>
            </div>
          ))}
          {!loading && pools.length === 0 && <div className={classes.empty}>Create a Launchpad pool before adding page placements.</div>}
        </div>
      </div>

      <div className={classes.placementEditor}>
        {!selectedPool ? (
          <div className={classes.panel}><div className={classes.empty}>Select a pool to manage its page placements.</div></div>
        ) : (
          <>
            <div className={`${classes.notice} ${!['active', 'closed'].includes(selectedPool.status) || selectedPool.publicationStatus !== 'published' ? classes.warning : ''}`}>
              <strong>{poolProjectName(selectedPool)}</strong> is {selectedPool.status} / {selectedPool.publicationStatus || 'draft'}.
              Public APIs return a placement only when it is enabled and its pool is published with an active or closed contract record. Adding it here never places it on the other page automatically.
              <div className={classes.headerActions} style={{ marginTop: 10 }}>
                {(['draft', 'published', 'hidden'] as const).map((status) => (
                  <button
                    key={status}
                    className={classes.secondaryButton}
                    type="button"
                    disabled={mutationBusy || selectedPool.publicationStatus === status}
                    onClick={() => changePublication(status)}
                  >Set {status}</button>
                ))}
              </div>
            </div>
            {placementsLoading
              ? <div className={classes.panel}><div className={classes.empty}>Loading page placements…</div></div>
              : PLACEMENT_SURFACES.map(renderPlacementCard)}
          </>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <main className={classes.page}>
        <header className={classes.header}>
          <div>
            <div className={classes.eyebrow}>FOMO v2 · Smart operations</div>
            <h1 className={classes.title}>Launchpad administration</h1>
            <p className={classes.subtitle}>Link a launch to the shared canonical project, create the BSC testnet pool, and reconcile every administrative transaction with the backend domain.</p>
          </div>
          <div className={classes.headerActions}>
            <div className={classes.networkCard}>
              <div className={classes.networkTitle}><span className={classes.networkDot} />{config?.chainName || 'BSC Testnet'} · chain {config?.chainId || BSC_TESTNET_CHAIN_ID}</div>
              <div className={classes.address}>Launchpad {shortAddress(config?.launchpadAddress)}</div>
              {wallet && <div className={classes.address}>Wallet {shortAddress(wallet.account)} · {wallet.isOwner ? 'owner' : wallet.isAdmin ? 'admin' : 'no role'}</div>}
            </div>
            <button className={classes.secondaryButton} type="button" onClick={connectWallet} disabled={walletLoading}>
              {walletLoading ? 'Connecting…' : wallet ? 'Reconnect wallet' : 'Connect admin wallet'}
            </button>
          </div>
        </header>

        <div className={classes.tabs}>
          <button className={`${classes.tab} ${tab === 'pools' ? classes.activeTab : ''}`} type="button" onClick={() => setTab('pools')}>Pools & actions</button>
          <button className={`${classes.tab} ${tab === 'create' ? classes.activeTab : ''}`} type="button" onClick={() => setTab('create')}>Create launch</button>
          <button className={`${classes.tab} ${tab === 'details' ? classes.activeTab : ''}`} type="button" onClick={() => setTab('details')}>Launch data</button>
          <button className={`${classes.tab} ${tab === 'placements' ? classes.activeTab : ''}`} type="button" onClick={() => setTab('placements')}>Page placements</button>
        </div>

        {wallet && !canManagePools && (
          <div className={`${classes.notice} ${classes.warning}`}>
            Connected account {shortAddress(wallet.account)} is neither the Launchpad owner nor an admin. Smart-contract mutations are disabled. Current owner: {shortAddress(wallet.owner)}.
          </div>
        )}

        {!loading && deploymentIssue && (
          <div className={`${classes.notice} ${classes.warning}`}>
            Smart mutations are disabled: {deploymentIssue}
          </div>
        )}

        {renderOperationOutbox()}

        {loading
          ? <div className={classes.panel}><div className={classes.empty}>Loading Launchpad configuration…</div></div>
          : tab === 'create'
            ? renderCreate()
            : tab === 'details'
              ? renderDetailsEditor()
            : tab === 'placements'
                ? renderPlacements()
                : renderPools()}
      </main>
    </Layout>
  );
};

export default LaunchpadAdminPage;
