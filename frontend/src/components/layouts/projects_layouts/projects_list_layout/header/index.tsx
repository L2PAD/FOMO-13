import {useMemo, useState} from 'react';
import { useMutation, useQuery } from 'react-query';
import Button from '../../../../common/button';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import {useStyles} from './styles';
import CreatingProjectModal from '../../modals/creating_project';
import SearchBar from '../../../../common/search';
import {
    fetchFomoV2HistoryImportLatest,
    FomoV2HistoryImportRun,
    startFomoV2HistoryImport,
} from '../../../../services/fomoV2MarketAdmin';

const isActiveRun = (run?: FomoV2HistoryImportRun | null): boolean => {
    return run?.status === 'queued' || run?.status === 'running';
}

const formatNumber = (value: any): string => {
    const parsed = Number(value || 0)
    return Number.isFinite(parsed) ? parsed.toLocaleString('en-US') : '0'
}

const formatDate = (value?: string): string => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString()
}

const Header = () => {
    const [isCreatingModal, setIsCreatingModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [hideStepsModal, setHideStepsModal] = useState(false)
    const [isImportPanelOpen, setIsImportPanelOpen] = useState(false)

    const historyImportQuery = useQuery(
        'fomo-v2-market-history-import-latest',
        fetchFomoV2HistoryImportLatest,
        {
            refetchOnWindowFocus: false,
            refetchInterval: (data) => isActiveRun(data?.run) ? 5000 : false,
        }
    )
    const startImportMutation = useMutation(startFomoV2HistoryImport, {
        onSuccess: () => {
            historyImportQuery.refetch()
        }
    })
    const latestRun = historyImportQuery.data?.run
    const progressPercent = Math.max(0, Math.min(100, Number(latestRun?.progressPercent || latestRun?.totals?.progressPercent || 0)))
    const canStartImport = !isActiveRun(latestRun) && !startImportMutation.isLoading
    const tierRows = useMemo(() => latestRun?.tiers || [], [latestRun])

    const {
        wrapper,
        leftWrapper,
        rightWrapper,
        mainTitle,
        creatingModalWrapper,
        importPanel,
        importPanelHeader,
        importPanelTitle,
        importStatus,
        importStatusRunning,
        importProgressTrack,
        importProgressBar,
        importStatsGrid,
        importStat,
        importTiers,
        importTierRow,
        importTierName,
        importTierMeta,
        importPanelActions,
        importMuted,
        importError,
    } = useStyles({isCreatingModal})

    return (
        <>
            <div className={wrapper}>
                <div className={leftWrapper}>
                    <h1 className={mainTitle}>
                        Projects list
                    </h1>
                    <SearchBar/>
                    <Filter />
                    <SortBy />
                </div>
                <div className={rightWrapper}>
                    <Button type='bordered' onClick={() => setIsImportPanelOpen((value) => !value)}>
                        Import Historical
                    </Button>
                    <Button type='bordered' onClick={() => setIsCreatingModal(true)}>
                        Create project
                    </Button>
                </div>
            </div>
            {isImportPanelOpen && (
                <div className={importPanel}>
                    <div className={importPanelHeader}>
                        <div>
                            <div className={importPanelTitle}>Historical price import</div>
                            <div className={importMuted}>
                                HOT max history, WARM 2 years, COLD 1 year
                            </div>
                        </div>
                        <div className={`${importStatus} ${isActiveRun(latestRun) ? importStatusRunning : ''}`}>
                            {latestRun?.status || 'not started'}
                        </div>
                    </div>
                    <div className={importProgressTrack}>
                        <div
                            className={importProgressBar}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className={importStatsGrid}>
                        <div className={importStat}>
                            <span>Progress</span>
                            <strong>{progressPercent.toFixed(1)}%</strong>
                        </div>
                        <div className={importStat}>
                            <span>Assets</span>
                            <strong>
                                {formatNumber(latestRun?.totals?.processedAssets)} / {formatNumber(latestRun?.totals?.totalAssets)}
                            </strong>
                        </div>
                        <div className={importStat}>
                            <span>Created</span>
                            <strong>{formatNumber(latestRun?.totals?.snapshotsCreated)}</strong>
                        </div>
                        <div className={importStat}>
                            <span>Updated</span>
                            <strong>{formatNumber(latestRun?.totals?.snapshotsUpdated)}</strong>
                        </div>
                    </div>
                    <div className={importTiers}>
                        {tierRows.length ? tierRows.map((tier) => (
                            <div className={importTierRow} key={tier.tier}>
                                <div>
                                    <div className={importTierName}>{tier.tier}</div>
                                    <div className={importTierMeta}>
                                        days: {tier.days} · {tier.status}
                                    </div>
                                </div>
                                <div className={importTierMeta}>
                                    {formatNumber(tier.processedAssets)} / {formatNumber(tier.totalAssets)}
                                    {' '}assets · {formatNumber(tier.snapshotsCreated)} new
                                </div>
                            </div>
                        )) : (
                            <div className={importMuted}>No import runs yet.</div>
                        )}
                    </div>
                    {latestRun?.activeAssetName && (
                        <div className={importMuted}>
                            Active: {latestRun.activeAssetName} {latestRun.activeCoingeckoId ? `(${latestRun.activeCoingeckoId})` : ''}
                        </div>
                    )}
                    {latestRun?.errorMessage && (
                        <div className={importError}>{latestRun.errorMessage}</div>
                    )}
                    {startImportMutation.isError && (
                        <div className={importError}>Failed to start import</div>
                    )}
                    <div className={importPanelActions}>
                        <Button
                            type='fill'
                            disabled={!canStartImport}
                            onClick={() => startImportMutation.mutate()}
                        >
                            {isActiveRun(latestRun) ? 'Import running' : 'Start HOT + WARM + COLD'}
                        </Button>
                        <Button type='bordered' onClick={() => historyImportQuery.refetch()}>
                            Refresh
                        </Button>
                    </div>
                    <div className={importMuted}>
                        Last update: {formatDate(latestRun?.lastHeartbeatAt || latestRun?.updatedAt)}
                    </div>
                </div>
            )}
            <div className={creatingModalWrapper}>
                <CreatingProjectModal
                    isAddInvestorsModal={isAddInvestorsModal}
                    onClose={() => setIsCreatingModal(false)}
                    backToCreatingModal={() => {
                        setIsAddInvestorsModal(false)
                    }}
                    hideModal={() => {
                        setHideStepsModal(true)
                        setIsAddInvestorsModal(true)
                    }}
                />
            </div>
        </>
    );
};

export default Header;
