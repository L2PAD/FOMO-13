import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layouts/main_layout/layout";
import {
  AdminDataSyncConfig,
  AdminDataSyncDiffCollection,
  AdminDataSyncDiffInput,
  AdminDataSyncDiffResult,
  AdminDataSyncDiffSample,
  AdminDataSyncJob,
  AdminDataSyncPreview,
  AdminDataSyncPromotion,
  applyAdminDataSyncPromotion,
  approveAdminDataSyncPromotion,
  createDevToProdDiff,
  fetchAdminDataSyncConfig,
  fetchAdminDataSyncJobs,
  fetchAdminDataSyncPromotions,
  previewProdToDevSync,
  rejectAdminDataSyncPromotion,
  runProdToDevSync,
} from "../../components/services/adminDataSync";
import ParsingManager from "./components/ParsingManager";
import { useStyles } from "./styles";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (value?: number) => {
  if (!value) return "-";
  if (value < 1000) return `${value}ms`;
  return `${Math.round(value / 1000)}s`;
};

const sumCounts = (counts?: Record<string, number | null>) =>
  Object.values(counts || {}).reduce<number>(
    (sum, value) => sum + Number(value || 0),
    0
  );

const formatCount = (value?: number | null) =>
  value === null || value === undefined ? "unavailable" : value.toLocaleString();

const splitIds = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const sumDiffOperations = (collections?: AdminDataSyncDiffCollection[]) =>
  (collections || []).reduce(
    (sum, item) =>
      sum +
      Number(item.inserts || 0) +
      Number(item.updates || 0) +
      Number(item.deletes || 0) +
      Number(item.conflicts || 0),
    0
  );

const getPromotionTotalOperations = (promotion: AdminDataSyncPromotion) => {
  const total = promotion.diffSummary?.totalOperations;
  return typeof total === "number"
    ? total
    : sumDiffOperations(promotion.diffSummary?.collections);
};

const getFilterValue = (
  filter: Record<string, unknown>,
  key: "canonicalProjectId" | "slug" | "updatedSince"
) => {
  const value = filter[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
};

const getIdsCount = (filter: Record<string, unknown>) => {
  const ids = filter.ids;
  if (Array.isArray(ids)) return ids.filter(Boolean).length;
  if (typeof ids === "string") return splitIds(ids).length;
  return 0;
};

const getPromotionFilter = (
  promotion?: AdminDataSyncPromotion | null
): Record<string, unknown> => {
  const selectedFilters = promotion?.selectedFilters;
  if (!isRecord(selectedFilters)) return {};

  return isRecord(selectedFilters.filter) ? selectedFilters.filter : {};
};

type ManagerTab = "database" | "parsing";

const formatRunMode = (mode?: AdminDataSyncConfig["prodToDevRunMode"]) => {
  if (mode === "disabled") return "Manual / Disabled";
  if (mode === "host-runner") return "Host runner";
  if (mode === "backend-native") return "Backend native";
  return "...";
};

const getPreviewRowStatus = (
  source?: number | null,
  target?: number | null
) => {
  if (source === null || target === null || source === undefined || target === undefined) {
    return { label: "Unavailable", className: "unavailable" };
  }

  if (source > 0 && target === 0) {
    return { label: "Target missing", className: "warning" };
  }

  if (source === target) {
    return { label: "In sync", className: "success" };
  }

  return { label: "Outdated", className: "warning" };
};

const AdminDataSyncPage = () => {
  const classes = useStyles();
  const [config, setConfig] = useState<AdminDataSyncConfig | null>(null);
  const [activeManager, setActiveManager] = useState<ManagerTab>("database");
  const [preview, setPreview] = useState<AdminDataSyncPreview | null>(null);
  const [lastPreviewAt, setLastPreviewAt] = useState<string>("");
  const [jobs, setJobs] = useState<AdminDataSyncJob[]>([]);
  const [promotions, setPromotions] = useState<AdminDataSyncPromotion[]>([]);
  const [diff, setDiff] = useState<AdminDataSyncDiffResult | null>(null);
  const [lastDiffInput, setLastDiffInput] = useState<AdminDataSyncDiffInput | null>(null);
  const [activePromotionId, setActivePromotionId] = useState("");
  const [collection, setCollection] = useState("");
  const [ids, setIds] = useState("");
  const [canonicalProjectId, setCanonicalProjectId] = useState("");
  const [slug, setSlug] = useState("");
  const [updatedSince, setUpdatedSince] = useState("");
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const latestJob = jobs[0];
  const isProdToDevRunDisabled =
    !config?.enabled ||
    !config?.prodToDevEnabled ||
    config?.prodToDevRunMode === "disabled";
  const isDevToProdApplyEnabled =
    Boolean(config?.devToProdApplyEnabled || config?.allowDevToProd);
  const activePromotion = useMemo(
    () =>
      promotions.find((item) => item.promotionId === activePromotionId) ||
      promotions.find((item) => item.promotionId === diff?.promotionId) ||
      null,
    [activePromotionId, diff?.promotionId, promotions]
  );

  const diffCollections: AdminDataSyncDiffCollection[] =
    diff?.collections ||
    activePromotion?.diffSummary?.collections ||
    [];
  const activeTotalOperations = activePromotion
    ? getPromotionTotalOperations(activePromotion)
    : diff?.totalOperations ?? sumDiffOperations(diffCollections);
  const activeHasNoChanges = Boolean(activePromotion && activeTotalOperations === 0);
  const activeStoredFilter = getPromotionFilter(activePromotion);
  const activeFallbackFilter =
    activePromotion?.promotionId === diff?.promotionId && lastDiffInput?.filter
      ? lastDiffInput.filter
      : {};
  const activeFilter = Object.keys(activeStoredFilter).length
    ? activeStoredFilter
    : activeFallbackFilter;
  const activeFilterCollections =
    activePromotion?.selectedCollections?.length
      ? activePromotion.selectedCollections
      : lastDiffInput?.collections?.length
      ? lastDiffInput.collections
      : diffCollections.map((item) => item.collection);
  const activeFilterItems = [
    {
      label: "Collection",
      value: activeFilterCollections.join(", "),
    },
    {
      label: "canonicalProjectId",
      value: getFilterValue(activeFilter, "canonicalProjectId"),
    },
    {
      label: "slug",
      value: getFilterValue(activeFilter, "slug"),
    },
    {
      label: "ids count",
      value: getIdsCount(activeFilter) ? String(getIdsCount(activeFilter)) : "",
    },
    {
      label: "updatedSince",
      value: getFilterValue(activeFilter, "updatedSince"),
    },
  ].filter((item) => item.value);
  const hasDiffSamples = diffCollections.some((item) => (item.samples || []).length > 0);
  const previewSourceTotal = preview ? sumCounts(preview.sourceCounts) : 0;
  const previewTargetTotal = preview ? sumCounts(preview.targetCounts) : 0;
  const latestPromotion = promotions[0];
  const dbSyncMode = isDevToProdApplyEnabled
    ? "Approval gated"
    : "Preview/Dry-run mode";

  const loadData = async () => {
    const [configResponse, jobsResponse, promotionsResponse] = await Promise.all([
      fetchAdminDataSyncConfig(),
      fetchAdminDataSyncJobs(),
      fetchAdminDataSyncPromotions(),
    ]);

    if (configResponse.success) {
      setConfig(configResponse.data);
      setCollection((current) => current || configResponse.data.devToProdAllowlist[0] || "");
    } else {
      setError(configResponse.error || "Failed to load Data Sync config");
    }

    if (jobsResponse.success) setJobs(jobsResponse.data);
    if (promotionsResponse.success) setPromotions(promotionsResponse.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePreview = async () => {
    setError("");
    setLoading(true);
    const response = await previewProdToDevSync();
    setLoading(false);

    if (!response.success) {
      setError(response.error || "Preview failed");
      return;
    }

    setPreview(response.data);
    setLastPreviewAt(new Date().toISOString());
  };

  const handleRun = async () => {
    setError("");
    setLoading(true);
    const response = await runProdToDevSync();
    setLoading(false);

    if (!response.success) {
      setError(response.error || "Sync job failed to start");
      return;
    }

    await loadData();
  };

  const handleCreateDiff = async () => {
    setError("");
    setLoading(true);
    const input: AdminDataSyncDiffInput = {
      collections: collection ? [collection] : [],
      mode: "selected_docs",
      filter: {
        ids: splitIds(ids),
        canonicalProjectId: canonicalProjectId.trim() || undefined,
        slug: slug.trim() || undefined,
        updatedSince: updatedSince.trim() || undefined,
      },
    };
    const response = await createDevToProdDiff(input);
    setLoading(false);

    if (!response.success) {
      setError(response.error || "Diff failed");
      return;
    }

    setLastDiffInput(input);
    setDiff(response.data);
    setActivePromotionId(response.data.promotionId);
    await loadData();
  };

  const handleApprove = async () => {
    if (!activePromotion) return;
    setError("");
    setLoading(true);
    const response = await approveAdminDataSyncPromotion(activePromotion.promotionId);
    setLoading(false);

    if (!response.success) {
      setError(response.error || "Approval failed");
      return;
    }

    setActivePromotionId(response.data.promotionId);
    await loadData();
  };

  const handleReject = async () => {
    if (!activePromotion) return;
    setError("");
    setLoading(true);
    const response = await rejectAdminDataSyncPromotion(activePromotion.promotionId);
    setLoading(false);

    if (!response.success) {
      setError(response.error || "Reject failed");
      return;
    }

    await loadData();
  };

  const handleApply = async () => {
    if (!activePromotion) return;
    setError("");
    setLoading(true);
    const response = await applyAdminDataSyncPromotion(
      activePromotion.promotionId,
      confirmationPhrase
    );
    setLoading(false);

    if (!response.success) {
      setError(response.error || "Apply failed");
      return;
    }

    setConfirmationPhrase("");
    await loadData();
  };

  const renderDiffRows = () =>
    diffCollections.flatMap((item: AdminDataSyncDiffCollection) =>
      (item.samples || []).map((sample: AdminDataSyncDiffSample) => (
        <tr key={`${item.collection}-${sample._id}-${sample.operation}`}>
          <td className={classes.mono}>{item.collection}</td>
          <td className={classes.mono}>{sample._id}</td>
          <td>{sample.operation}</td>
          <td>{sample.riskLevel}</td>
          <td>{(sample.changedFields || []).join(", ") || "-"}</td>
        </tr>
      ))
    );

  return (
    <Layout>
      <div className={classes.page}>
        <div className={classes.header}>
          <div>
            <h1>FOMO Data Control Center</h1>
            <p>
              Manage safe database synchronization and parser pipeline operations
              for FOMO v2.
            </p>
          </div>
          <div className={classes.badgeRow}>
            <span className={`${classes.badge} ${classes.successBadge}`}>Safe</span>
            <span
              className={`${classes.badge} ${
                isDevToProdApplyEnabled ? classes.dangerBadge : classes.neutralBadge
              }`}
            >
              {isDevToProdApplyEnabled ? "Apply enabled" : "Dry-run only"}
            </span>
          </div>
        </div>

        <div className={classes.statusRail}>
          <div className={classes.statusItem}>
            <span>Production DB</span>
            <strong>{config?.prodDb || "..."}</strong>
          </div>
          <div className={classes.statusItem}>
            <span>Development DB</span>
            <strong>{config?.devDb || "..."}</strong>
          </div>
          <div className={classes.statusItem}>
            <span>DB Sync</span>
            <strong>{dbSyncMode}</strong>
          </div>
          <div className={classes.statusItem}>
            <span>Prod -&gt; Dev Run</span>
            <strong>{formatRunMode(config?.prodToDevRunMode)}</strong>
          </div>
          <div className={classes.statusItem}>
            <span>Dev -&gt; Prod Apply</span>
            <strong>{isDevToProdApplyEnabled ? "Enabled" : "Disabled"}</strong>
          </div>
        </div>

        <div className={classes.managerTabs} role="tablist" aria-label="Data managers">
          <button
            aria-selected={activeManager === "database"}
            className={`${classes.managerTab} ${
              activeManager === "database" ? classes.managerTabActive : ""
            }`}
            onClick={() => setActiveManager("database")}
            role="tab"
            type="button"
          >
            Database Manager
          </button>
          <button
            aria-selected={activeManager === "parsing"}
            className={`${classes.managerTab} ${
              activeManager === "parsing" ? classes.managerTabActive : ""
            }`}
            onClick={() => setActiveManager("parsing")}
            role="tab"
            type="button"
          >
            Parsing Manager
          </button>
        </div>

        {error ? <div className={classes.error}>{error}</div> : null}

        {activeManager === "database" ? (
          <>
            <section className={classes.managerIntro}>
              <div>
                <h2>Database Manager</h2>
                <p>
                  Safe prod/dev refresh previews, dev-to-prod dry-run diffs, and
                  promotion audit history.
                </p>
              </div>
              <div className={classes.badgeRow}>
                <span className={`${classes.badge} ${classes.neutralBadge}`}>
                  {config?.enabled ? "Enabled" : "Disabled"}
                </span>
                <span className={`${classes.badge} ${classes.warningBadge}`}>
                  {config?.prodToDevRunMode === "disabled" ? "Manual" : "Runner"}
                </span>
              </div>
            </section>

            <section className={classes.panel}>
              <div className={classes.panelHeader}>
                <h2>Database Overview</h2>
                <p>Current sync posture and latest database activity.</p>
              </div>
              <div className={classes.panelBody}>
                <div className={classes.summaryGrid}>
                  <div className={classes.stat}>
                    <span>Source DB</span>
                    <strong>{config?.sourceDb || config?.prodDb || "fomo_live"}</strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Target DB</span>
                    <strong>{config?.targetDb || config?.devDb || "fomo_dev"}</strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Run mode</span>
                    <strong>{formatRunMode(config?.prodToDevRunMode)}</strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Apply</span>
                    <strong>{isDevToProdApplyEnabled ? "Enabled" : "Disabled"}</strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Last preview</span>
                    <strong>{lastPreviewAt ? formatDate(lastPreviewAt) : "none"}</strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Preview totals</span>
                    <strong>
                      {preview
                        ? `${previewSourceTotal.toLocaleString()} / ${previewTargetTotal.toLocaleString()}`
                        : "-"}
                    </strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Latest job</span>
                    <strong>{latestJob?.status || "none"}</strong>
                  </div>
                  <div className={classes.stat}>
                    <span>Latest promotion</span>
                    <strong>{latestPromotion?.status || "none"}</strong>
                  </div>
                </div>
              </div>
            </section>

            <div className={classes.grid}>
              <section className={classes.panel}>
                <div className={classes.panelHeader}>
                  <h2>Prod -&gt; Dev Refresh</h2>
                  <p>
                    {config?.sourceDb || "fomo_live"} to{" "}
                    {config?.targetDb || "fomo_dev"}
                  </p>
                </div>
                <div className={classes.panelBody}>
                  <div className={classes.chips}>
                    {(config?.prodToDevAllowlist || []).map((item) => (
                      <span className={classes.chip} key={item}>
                        {item}
                      </span>
                    ))}
                  </div>

                  {config?.prodToDevRunMode === "disabled" ? (
                    <div className={classes.notice}>
                      Run the VPS script manually or enable a safe runner.
                    </div>
                  ) : null}

                  <div className={classes.actions}>
                    <button
                      className={`${classes.button} ${classes.ghostButton}`}
                      disabled={loading || !config?.enabled || !config?.prodToDevEnabled}
                      onClick={handlePreview}
                      type="button"
                    >
                      Preview sync
                    </button>
                    <button
                      className={`${classes.button} ${classes.secondaryButton}`}
                      disabled={loading || isProdToDevRunDisabled}
                      onClick={handleRun}
                      type="button"
                    >
                      {config?.prodToDevRunMode === "host-runner"
                        ? "Queue sync"
                        : "Run sync"}
                    </button>
                    <button
                      className={`${classes.button} ${classes.ghostButton}`}
                      disabled={loading}
                      onClick={loadData}
                      type="button"
                    >
                      View last report
                    </button>
                  </div>

                  {preview ? (
                    <>
                      {(preview.warnings || []).map((warning) => (
                        <div className={classes.notice} key={warning}>
                          {warning}
                        </div>
                      ))}
                      <div className={classes.tableWrap}>
                        <table className={classes.table}>
                          <thead>
                            <tr>
                              <th>Collection</th>
                              <th>Source</th>
                              <th>Target</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.allowlistedCollections.map((item) => {
                              const rowStatus = getPreviewRowStatus(
                                preview.sourceCounts[item],
                                preview.targetCounts[item]
                              );
                              const statusClass =
                                rowStatus.className === "success"
                                  ? classes.successBadge
                                  : rowStatus.className === "warning"
                                  ? classes.warningBadge
                                  : classes.neutralBadge;

                              return (
                                <tr key={item}>
                                  <td className={classes.mono}>{item}</td>
                                  <td>{formatCount(preview.sourceCounts[item])}</td>
                                  <td>{formatCount(preview.targetCounts[item])}</td>
                                  <td>
                                    <span
                                      className={`${classes.badge} ${classes.inlineBadgeReset} ${statusClass}`}
                                    >
                                      {rowStatus.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className={classes.emptyState}>
                      <strong>No preview loaded.</strong>
                      <p>Run Preview sync to compare source and target collection counts.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className={classes.panel}>
                <div className={classes.panelHeader}>
                  <h2>Dev -&gt; Prod Promotion</h2>
                  <p>
                    {config?.devToProdMode === "dry_run_only"
                      ? "Diff and review only"
                      : "Approval gated apply"}
                  </p>
                </div>
                <div className={classes.panelBody}>
                  {!isDevToProdApplyEnabled ? (
                    <div className={classes.notice}>
                      Dev -&gt; Prod Apply is disabled. You can create and review
                      dry-run diffs, but production changes cannot be applied.
                    </div>
                  ) : null}

                  <div className={classes.formGrid}>
                    <label className={classes.label}>
                      Collection
                      <select
                        className={classes.input}
                        onChange={(event) => setCollection(event.target.value)}
                        value={collection}
                      >
                        {(config?.devToProdAllowlist || []).map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={classes.label}>
                      Canonical project id
                      <input
                        className={classes.input}
                        onChange={(event) => setCanonicalProjectId(event.target.value)}
                        value={canonicalProjectId}
                      />
                    </label>
                    <label className={classes.label}>
                      IDs
                      <input
                        className={classes.input}
                        onChange={(event) => setIds(event.target.value)}
                        value={ids}
                      />
                    </label>
                    <label className={classes.label}>
                      Slug
                      <input
                        className={classes.input}
                        onChange={(event) => setSlug(event.target.value)}
                        value={slug}
                      />
                    </label>
                    <label className={classes.label}>
                      Updated since
                      <input
                        className={classes.input}
                        onChange={(event) => setUpdatedSince(event.target.value)}
                        type="datetime-local"
                        value={updatedSince}
                      />
                    </label>
                    <label className={classes.label}>
                      Confirmation
                      <input
                        className={classes.input}
                        onChange={(event) => setConfirmationPhrase(event.target.value)}
                        value={confirmationPhrase}
                      />
                    </label>
                  </div>

                  <div className={classes.actions}>
                    <button
                      className={`${classes.button} ${classes.ghostButton}`}
                      disabled={loading || !config?.enabled || !config?.devToProdDiffEnabled}
                      onClick={handleCreateDiff}
                      type="button"
                    >
                      Create diff
                    </button>
                    <button
                      className={classes.button}
                      disabled={
                        loading ||
                        !activePromotion ||
                        activePromotion.status !== "draft"
                      }
                      onClick={handleApprove}
                      type="button"
                    >
                      Approve promotion
                    </button>
                    <button
                      className={`${classes.button} ${classes.dangerButton}`}
                      disabled={
                        loading ||
                        !isDevToProdApplyEnabled ||
                        !activePromotion ||
                        activePromotion.status !== "approved"
                      }
                      onClick={handleApply}
                      type="button"
                    >
                      Apply to prod
                    </button>
                    <button
                      className={`${classes.button} ${classes.ghostButton}`}
                      disabled={loading || !activePromotion}
                      onClick={handleReject}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>

                  {activePromotion ? (
                    <div className={classes.activePromotion}>
                      <div className={classes.activePromotionHeader}>
                        <span className={classes.mutedText}>Active promotion</span>
                        {activeHasNoChanges ? (
                          <span className={`${classes.badge} ${classes.neutralBadge}`}>
                            No changes
                          </span>
                        ) : null}
                      </div>
                      <div className={classes.summaryGrid}>
                        <div className={classes.stat}>
                          <span>Promotion</span>
                          <strong className={classes.mono}>
                            {activePromotion.promotionId}
                          </strong>
                        </div>
                        <div className={classes.stat}>
                          <span>Status</span>
                          <strong>{activePromotion.status}</strong>
                        </div>
                        <div className={classes.stat}>
                          <span>Ops</span>
                          <strong>{activeTotalOperations.toLocaleString()}</strong>
                        </div>
                        <div className={classes.stat}>
                          <span>Backup</span>
                          <strong className={classes.mono}>
                            {activePromotion.backupPath || "-"}
                          </strong>
                        </div>
                      </div>
                      {activeFilterItems.length ? (
                        <div className={classes.filterSummary}>
                          {activeFilterItems.map((item) => (
                            <div className={classes.filterItem} key={item.label}>
                              <span>{item.label}</span>
                              {item.value}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {activePromotion.status === "draft" && activeHasNoChanges ? (
                        <p className={classes.mutedText}>
                          This draft promotion is safe: Ops is 0, so there is no
                          operation payload to apply to production.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {activePromotion && activeHasNoChanges ? (
                    <div className={classes.emptyState}>
                      <strong>No differences found.</strong>
                      <p>
                        Dev and prod documents match for the selected
                        collection/filter.
                      </p>
                      <p>No production changes were made.</p>
                    </div>
                  ) : activePromotion && diffCollections.length && hasDiffSamples ? (
                    <div className={classes.tableWrap}>
                      <table className={classes.table}>
                        <thead>
                          <tr>
                            <th>Collection</th>
                            <th>ID</th>
                            <th>Operation</th>
                            <th>Risk</th>
                            <th>Changed fields</th>
                          </tr>
                        </thead>
                        <tbody>{renderDiffRows()}</tbody>
                      </table>
                    </div>
                  ) : activePromotion && diffCollections.length ? (
                    <div className={classes.notice}>
                      Diff summary is available, but no sample rows were returned.
                    </div>
                  ) : (
                    <div className={classes.emptyState}>
                      <strong>No active promotion selected.</strong>
                      <p>Create a dry-run diff or select a promotion from history.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className={classes.panel}>
              <div className={classes.panelHeader}>
                <h2>Jobs &amp; Audit</h2>
                <p>Refresh jobs and dev-to-prod promotion history.</p>
              </div>
              <div className={classes.panelBody}>
                <div className={classes.auditGrid}>
                  <div>
                    <h3 className={classes.subheading}>Jobs History</h3>
                    {jobs.length ? (
                      <div className={classes.tableWrap}>
                        <table className={classes.table}>
                          <thead>
                            <tr>
                              <th>Job</th>
                              <th>Status</th>
                              <th>Duration</th>
                              <th>Backup</th>
                              <th>Copied</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobs.map((job) => (
                              <tr key={job._id}>
                                <td className={classes.mono}>{job._id}</td>
                                <td>{job.status}</td>
                                <td>{formatDuration(job.durationMs)}</td>
                                <td className={classes.mono}>{job.backupPath || "-"}</td>
                                <td>{sumCounts(job.copiedCounts).toLocaleString()}</td>
                                <td>{formatDate(job.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={classes.emptyState}>
                        <strong>No jobs yet.</strong>
                        <p>Queued prod-to-dev refresh jobs will appear here.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className={classes.subheading}>Promotion History</h3>
                    {promotions.length ? (
                      <div className={classes.tableWrap}>
                        <table className={classes.table}>
                          <thead>
                            <tr>
                              <th>Promotion</th>
                              <th>Status</th>
                              <th>Collections</th>
                              <th>Ops</th>
                              <th>Backup</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promotions.map((promotion) => {
                              const totalOperations =
                                getPromotionTotalOperations(promotion);

                              return (
                                <tr
                                  key={promotion.promotionId}
                                  onClick={() =>
                                    setActivePromotionId(promotion.promotionId)
                                  }
                                >
                                  <td className={classes.mono}>
                                    {promotion.promotionId}
                                  </td>
                                  <td>
                                    {promotion.status}
                                    {totalOperations === 0 ? (
                                      <span
                                        className={`${classes.badge} ${classes.neutralBadge} ${classes.inlineBadge}`}
                                      >
                                        No changes
                                      </span>
                                    ) : null}
                                  </td>
                                  <td>{promotion.selectedCollections.join(", ")}</td>
                                  <td>{totalOperations}</td>
                                  <td className={classes.mono}>
                                    {promotion.backupPath || "-"}
                                  </td>
                                  <td>{formatDate(promotion.createdAt)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={classes.emptyState}>
                        <strong>No promotions yet.</strong>
                        <p>Dry-run diffs and promotion decisions will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <ParsingManager />
        )}
      </div>
    </Layout>
  );
};

export default AdminDataSyncPage;
