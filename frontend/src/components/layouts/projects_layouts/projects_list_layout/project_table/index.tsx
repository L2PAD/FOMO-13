import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import Loader from '../../../../common/loader';
import loader from '../../../../services/loader';
import {
    fetchFomoV2MarketProjects,
    FomoV2AdminMarketProject,
    toggleFomoV2MarketProjectEralash,
    toggleFomoV2MarketProjectSponsored,
} from '../../../../services/fomoV2MarketAdmin';
import { useStyles } from './styles';

const limit = 25;

const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

const formatCompactUsd = (value: any): string => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return '-';
    if (parsed >= 1_000_000_000) return `$${(parsed / 1_000_000_000).toFixed(2)}B`;
    if (parsed >= 1_000_000) return `$${(parsed / 1_000_000).toFixed(2)}M`;
    if (parsed >= 100_000) return `$${(parsed / 1_000).toFixed(2)}K`;
    return `$${parsed.toLocaleString('en-US', { maximumFractionDigits: parsed >= 1 ? 2 : 8 })}`;
}

const formatPercent = (value: any): string => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '-';
    return `${parsed > 0 ? '+' : ''}${parsed.toFixed(2)}%`;
}

const formatDate = (value?: string): string => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
}

const tierTone = (tier?: string): string => {
    if (tier === 'HOT') return 'hot';
    if (tier === 'WARM') return 'warm';
    if (tier === 'COLD') return 'cold';
    return '';
}

const ProjectTable = () => {
    const [page, setPage] = useState(1);
    const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);
    const search: string = useSelector((state: any) => state.search.searchValue);
    const debouncedSearch = useDebounce(search, 300);
    const queryClient = useQueryClient();

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const { data, isLoading, isFetching, error } = useQuery(
        ['fomo-v2-market-projects', page, debouncedSearch],
        () => fetchFomoV2MarketProjects({
            offset: 0,
            limit: limit * page,
            searchValue: debouncedSearch,
            tier: 'all',
        }),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        }
    );
    const projects = data?.projects || [];
    const hasMore = projects.length < Number(data?.total || 0);

    const toggleSponsored = async (project: FomoV2AdminMarketProject) => {
        const id = project.readModelId || project._id;
        setUpdatingProjectId(id);
        try {
            await toggleFomoV2MarketProjectSponsored(id);
            await queryClient.invalidateQueries('fomo-v2-market-projects');
        } finally {
            setUpdatingProjectId(null);
        }
    };

    const toggleEralash = async (project: FomoV2AdminMarketProject) => {
        const id = project.readModelId || project._id;
        setUpdatingProjectId(id);
        try {
            await toggleFomoV2MarketProjectEralash(id);
            await queryClient.invalidateQueries('fomo-v2-market-projects');
        } finally {
            setUpdatingProjectId(null);
        }
    };

    const {
        wrapper,
        summary,
        table,
        headerWrapper,
        rowWrapper,
        projectCell,
        projectImage,
        projectTitle,
        projectDescription,
        tierBadge,
        rankCell,
        priceCell,
        metricCell,
        historyCell,
        statusCell,
        flagsCell,
        actionsCell,
        statusBadge,
        muted,
        positive,
        negative,
        showMoreButton,
        emptyState,
    } = useStyles();

    return (
        <>
            <div className={summary}>
                <span>FOMO v2 market projects</span>
                <strong>{Number(data?.total || 0).toLocaleString('en-US')} total</strong>
                {isFetching && !isLoading && <span className={muted}>Refreshing...</span>}
            </div>
            <div className={wrapper}>
                <div className={`${headerWrapper} container`}>
                    <div className={projectCell}>Project</div>
                    <div className={rankCell}>Rank</div>
                    <div className={priceCell}>Price</div>
                    <div className={metricCell}>Market Cap</div>
                    <div className={metricCell}>Volume 24h</div>
                    <div className={historyCell}>History</div>
                    <div className={statusCell}>Updated</div>
                    <div className={flagsCell}>Flags</div>
                    <div className={actionsCell}>Actions</div>
                </div>
            </div>
            <div className={table}>
                {projects.map((project: FomoV2AdminMarketProject) => {
                    const changeClass = Number(project.priceChange || 0) >= 0 ? positive : negative;
                    const projectId = project.readModelId || project._id;
                    const isUpdating = updatingProjectId === projectId;
                    return (
                        <div className={`${rowWrapper} container`} key={projectId}>
                            <div className={projectCell}>
                                <img className={projectImage} src={loader(project.logo)} alt={project.name || 'Project'} />
                                <div>
                                    <div className={projectTitle}>
                                        {project.name || '-'}
                                        <span className={`${tierBadge} ${tierTone(project.tier)}`}>
                                            {project.tier || '-'}
                                        </span>
                                    </div>
                                    <div className={projectDescription}>
                                        {project.symbol || '-'} · {project.coingeckoId || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className={rankCell}>#{project.rank || '-'}</div>
                            <div className={priceCell}>
                                <div>{formatCompactUsd(project.price)}</div>
                                <span className={changeClass}>{formatPercent(project.priceChange)}</span>
                            </div>
                            <div className={metricCell}>{formatCompactUsd(project.marketCap)}</div>
                            <div className={metricCell}>{formatCompactUsd(project.volume24h)}</div>
                            <div className={historyCell}>
                                <div>{Number(project.historyPoints || 0).toLocaleString('en-US')} points</div>
                                <span className={muted}>{formatDate(project.latestHistoryAt)}</span>
                            </div>
                            <div className={statusCell}>
                                <div>{formatDate(project.marketDataUpdatedAt)}</div>
                                <span className={muted}>
                                    chart {formatDate(project.chart7dUpdatedAt)}
                                </span>
                            </div>
                            <div className={flagsCell}>
                                {project.isSponsored ? (
                                    <span className={`${statusBadge} sponsored`}>Sponsored</span>
                                ) : null}
                                {project.isEralash ? (
                                    <span className={`${statusBadge} eralash`}>Eralash</span>
                                ) : null}
                                {!project.isSponsored && !project.isEralash ? (
                                    <span className={muted}>-</span>
                                ) : null}
                            </div>
                            <div className={actionsCell}>
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => toggleSponsored(project)}
                                >
                                    {project.isSponsored ? 'Remove Sponsored' : 'Add Sponsored'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => toggleEralash(project)}
                                >
                                    {project.isEralash ? 'Remove Eralash' : 'Add Eralash'}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {!isLoading && !projects.length && (
                    <div className={emptyState}>
                        No FOMO v2 market projects found
                    </div>
                )}
                {hasMore && (
                    <button
                        onClick={() => setPage((prev: number) => prev + 1)}
                        className={showMoreButton}>
                        Show more
                    </button>
                )}
            </div>
            {isLoading && <Loader />}
            {error && (
                <div className={emptyState}>
                    Failed to load FOMO v2 market projects
                </div>
            )}
        </>
    );
};

export default ProjectTable;
