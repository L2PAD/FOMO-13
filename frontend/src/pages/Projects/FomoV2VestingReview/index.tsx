import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../../components/layouts/main_layout/layout";
import loader from "../../../components/services/loader";
import {
  approveFomoV2ReviewCase,
  fetchFomoV2ProjectVesting,
  fetchFomoV2ReviewCase,
  fetchFomoV2ReviewCases,
  FomoV2ProjectSummary,
  FomoV2ProjectVestingResponse,
  FomoV2ReviewCase,
  FomoV2ReviewCaseFilters,
  FomoV2UnlockImportResult,
  FomoV2UnlockStageResult,
  FomoV2VestingOverridePayload,
  ignoreFomoV2ReviewCase,
  importFomoV2Unlocks,
  rejectFomoV2ReviewCase,
  stageFomoV2ReviewCaseUnlocks,
  updateFomoV2ProjectVesting,
} from "../../../components/services/fomoV2ReviewCases";
import { useStyles } from "./styles";

type RawRecord = Record<string, unknown>;
type DraftTableKey = "tokenAllocation" | "vestingRounds" | "vestingSchedule";

interface FieldDefinition {
  key: string;
  label: string;
  kind?: "date" | "number" | "text";
  minWidth?: number;
}

interface VestingDraft {
  tokenAllocation: RawRecord[];
  vestingRounds: RawRecord[];
  vestingSchedule: RawRecord[];
  vestingSummary: RawRecord;
  scheduleSourceKey: "vestingSchedule" | "vestingTimeline";
  extras: {
    vestingTimeline?: RawRecord[];
    unlockingEvents?: RawRecord[];
    nextUnlockingEvent?: RawRecord;
    publicVesting?: RawRecord[];
  };
}

const VESTING_REVIEW_TYPES = "vesting_component_relation_review,existing_vesting_source";
const BULK_PAGE_LIMIT = 200;
const NON_APPLY_ACTION_HINT =
  "Reject/Ignore only closes this review case and does not apply vesting changes.";

type NonApplyCaseAction = "reject" | "ignore";

const ALLOCATION_FIELDS: FieldDefinition[] = [
  { key: "name", label: "Allocation", minWidth: 180 },
  { key: "saleId", label: "Sale ID", minWidth: 92 },
  { key: "percent", label: "Percent", kind: "number", minWidth: 92 },
  { key: "amount", label: "Amount", kind: "number", minWidth: 120 },
  { key: "normalizedCategory", label: "Category", minWidth: 130 },
];

const ROUND_FIELDS: FieldDefinition[] = [
  { key: "roundName", label: "Round", minWidth: 180 },
  { key: "saleId", label: "Sale ID", minWidth: 92 },
  { key: "totalAmount", label: "Total", kind: "number", minWidth: 120 },
  { key: "tgeUnlockPercent", label: "TGE", kind: "number", minWidth: 82 },
  { key: "vestingType", label: "Type", minWidth: 120 },
  { key: "vestingFrequency", label: "Frequency", minWidth: 110 },
  { key: "vestingDurationMonths", label: "Months", kind: "number", minWidth: 86 },
  { key: "vestedPercent", label: "Unlocked", kind: "number", minWidth: 96 },
  { key: "lockedPercent", label: "Locked", kind: "number", minWidth: 92 },
  { key: "startDate", label: "Start", kind: "date", minWidth: 126 },
  { key: "endDate", label: "End", kind: "date", minWidth: 126 },
];

const SCHEDULE_FIELDS: FieldDefinition[] = [
  { key: "roundName", label: "Round", minWidth: 180 },
  { key: "saleId", label: "Sale ID", minWidth: 92 },
  { key: "tgeUnlockPercent", label: "TGE", kind: "number", minWidth: 82 },
  { key: "vestingType", label: "Type", minWidth: 120 },
  { key: "vestingFrequency", label: "Frequency", minWidth: 110 },
  { key: "vestingDurationMonths", label: "Months", kind: "number", minWidth: 86 },
  { key: "currentUnlockedPercent", label: "Unlocked", kind: "number", minWidth: 96 },
  { key: "currentLockedPercent", label: "Locked", kind: "number", minWidth: 92 },
  { key: "startDate", label: "Start", kind: "date", minWidth: 126 },
  { key: "endDate", label: "End", kind: "date", minWidth: 126 },
  { key: "dateConfidence", label: "Confidence", minWidth: 110 },
];

const SUMMARY_FIELDS: FieldDefinition[] = [
  { key: "totalAmount", label: "Total amount", kind: "number" },
  { key: "unlockedAmount", label: "Unlocked amount", kind: "number" },
  { key: "lockedAmount", label: "Locked amount", kind: "number" },
  { key: "untrackedAmount", label: "Untracked amount", kind: "number" },
  { key: "unlockedPercent", label: "Unlocked %", kind: "number" },
  { key: "lockedPercent", label: "Locked %", kind: "number" },
  { key: "untrackedPercent", label: "Untracked %", kind: "number" },
  { key: "unlockedValueUsd", label: "Unlocked USD", kind: "number" },
  { key: "lockedValueUsd", label: "Locked USD", kind: "number" },
  { key: "lastUnlockDate", label: "Last unlock", kind: "date" },
  { key: "nextUnlockDate", label: "Next unlock", kind: "date" },
];

const NUMERIC_FIELDS = new Set(
  [
    ...ALLOCATION_FIELDS,
    ...ROUND_FIELDS,
    ...SCHEDULE_FIELDS,
    ...SUMMARY_FIELDS,
  ]
    .filter((field) => field.kind === "number")
    .map((field) => field.key)
);

const FomoV2VestingReviewPage = () => {
  const classes = useStyles();
  const [filters, setFilters] = useState<FomoV2ReviewCaseFilters>({
    status: "open",
    domain: "vesting",
    type: VESTING_REVIEW_TYPES,
    sort: "project_rank",
    page: 1,
    limit: 100,
  });
  const [items, setItems] = useState<FomoV2ReviewCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [nonApplyAction, setNonApplyAction] = useState<NonApplyCaseAction | null>(null);
  const [selectedCase, setSelectedCase] = useState<FomoV2ReviewCase | null>(null);
  const [draft, setDraft] = useState<VestingDraft | null>(null);
  const [baselineDraft, setBaselineDraft] = useState<VestingDraft | null>(null);
  const [confirmedVesting, setConfirmedVesting] = useState<FomoV2ProjectVestingResponse | null>(null);
  const [note, setNote] = useState("");
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [unlockImporting, setUnlockImporting] = useState(false);
  const [projectUnlockImporting, setProjectUnlockImporting] = useState(false);
  const [unlockImportResult, setUnlockImportResult] = useState<{
    result: FomoV2UnlockImportResult;
    scope: string;
  } | null>(null);
  const [unlockStageResult, setUnlockStageResult] = useState<{
    result: FomoV2UnlockStageResult;
    scope: string;
  } | null>(null);
  const [bulkProgress, setBulkProgress] = useState({
    done: 0,
    failed: 0,
    total: 0,
    current: "",
  });

  const selectedCounts = useMemo(() => (draft ? draftCounts(draft) : emptyCounts()), [draft]);
  const editingConfirmedVesting = Boolean(confirmedVesting);
  const selectedCaseBusy = applying || Boolean(nonApplyAction);
  const draftIsEdited = useMemo(() => {
    if (!draft || !baselineDraft) return false;
    return JSON.stringify(overrideFromDraft(draft)) !== JSON.stringify(overrideFromDraft(baselineDraft));
  }, [draft, baselineDraft]);

  const loadCases = async (nextFilters = filters) => {
    setLoading(true);
    const response = await fetchFomoV2ReviewCases(nextFilters);
    setLoading(false);
    if (!response.success) {
      toast.error(response.error || "Failed to load vesting review cases");
      return;
    }
    setItems(response.data.items.filter(isVestingApplyCase));
    setTotal(response.data.total);
  };

  useEffect(() => {
    loadCases();
  }, [filters.status, filters.search, filters.page, filters.limit]);

  const openCase = async (reviewCase: FomoV2ReviewCase) => {
    const initialDraft = draftFromReviewCase(reviewCase);
    setSelectedCase(reviewCase);
    setDraft(initialDraft);
    setBaselineDraft(initialDraft);
    setConfirmedVesting(null);
    setNote(reviewCase.decisionNote || "");
    setDetailLoading(true);
    const response = await fetchFomoV2ReviewCase(reviewCase.id);
    if (!response.success) {
      setDetailLoading(false);
      toast.error(response.error || "Failed to load vesting data");
      return;
    }
    const detailedCase = response.data;
    setSelectedCase(detailedCase);
    setNote(detailedCase.decisionNote || "");

    if (shouldLoadConfirmedVesting(detailedCase)) {
      const canonicalProjectId = detailedCase.canonicalProjectId || detailedCase.canonicalProject?.id;
      if (canonicalProjectId) {
        const vestingResponse = await fetchFomoV2ProjectVesting(canonicalProjectId);
        setDetailLoading(false);
        if (vestingResponse.success) {
          const confirmedDraft = draftFromRawSource(vestingResponse.data.vesting.rawSource);
          setDraft(confirmedDraft);
          setBaselineDraft(confirmedDraft);
          setConfirmedVesting(vestingResponse.data);
          return;
        }
        toast.error(vestingResponse.error || "Failed to load confirmed vesting");
      }
    }

    const detailedDraft = draftFromReviewCase(detailedCase);
    setDetailLoading(false);
    setDraft(detailedDraft);
    setBaselineDraft(detailedDraft);
  };

  const updateFilter = (key: keyof FomoV2ReviewCaseFilters, value: string | number) => {
    setFilters((state) => ({
      ...state,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  const updateRow = (table: DraftTableKey, rowIndex: number, key: string, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        [table]: current[table].map((row, index) =>
          index === rowIndex ? { ...row, [key]: value } : row
        ),
      };
    });
  };

  const addRow = (table: DraftTableKey) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        [table]: [...current[table], emptyRowFor(table)],
      };
    });
  };

  const removeRow = (table: DraftTableKey, rowIndex: number) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        [table]: current[table].filter((_, index) => index !== rowIndex),
      };
    });
  };

  const updateSummary = (key: string, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        vestingSummary: {
          ...current.vestingSummary,
          [key]: value,
        },
      };
    });
  };

  const applySelected = async () => {
    if (!selectedCase || !draft) return;
    const project = projectName(selectedCase);
    const actionLabel = editingConfirmedVesting ? "Save confirmed vesting" : "Apply edited vesting";
    if (!window.confirm(`${actionLabel} for ${project}?`)) return;
    setApplying(true);
    const canonicalProjectId = selectedCase.canonicalProjectId || selectedCase.canonicalProject?.id;
    if (editingConfirmedVesting && !canonicalProjectId) {
      setApplying(false);
      toast.error("Canonical project is required to save confirmed vesting");
      return;
    }
    if (editingConfirmedVesting && canonicalProjectId) {
      const response = await updateFomoV2ProjectVesting(
        canonicalProjectId,
        overrideFromDraft(draft),
        note
      );
      setApplying(false);
      if (!response.success) {
        toast.error(response.error || "Failed to save confirmed vesting");
        return;
      }
      const confirmedDraft = draftFromRawSource(response.data.vesting.rawSource);
      setDraft(confirmedDraft);
      setBaselineDraft(confirmedDraft);
      setConfirmedVesting(response.data);
      setSelectedCase((current) =>
        mergeSelectedProject(current, response.data.project)
      );
      toast.success("Confirmed vesting updated");
      await loadCases(filters);
      return;
    }

    const response = await approveFomoV2ReviewCase(
      selectedCase.id,
      note,
      true,
      overrideFromDraft(draft)
    );
    setApplying(false);
    if (!response.success) {
      toast.error(response.error || "Failed to apply vesting");
      return;
    }
    toast.success("Vesting applied");
    setSelectedCase(null);
    setDraft(null);
    setBaselineDraft(null);
    setConfirmedVesting(null);
    await loadCases({ ...filters, page: 1 });
  };

  const clearSelectedCase = () => {
    setSelectedCase(null);
    setDraft(null);
    setBaselineDraft(null);
    setConfirmedVesting(null);
    setNote("");
  };

  const nonApplyActionError = (error: string | undefined, action: NonApplyCaseAction) => {
    if (error?.includes("Review case is already resolved")) {
      return "This vesting review case is already resolved. Refresh the list to see the latest status.";
    }
    return error || `Failed to ${action} vesting review case`;
  };

  const runNonApplyAction = async (action: NonApplyCaseAction) => {
    if (!selectedCase) return;
    setNonApplyAction(action);
    try {
      const response =
        action === "reject"
          ? await rejectFomoV2ReviewCase(selectedCase.id, note)
          : await ignoreFomoV2ReviewCase(selectedCase.id, note);
      if (!response.success) {
        toast.error(nonApplyActionError(response.error, action));
        return;
      }
      toast.success(action === "reject" ? "Vesting review case rejected" : "Vesting review case ignored");
      clearSelectedCase();
      await loadCases({ ...filters, page: 1 });
    } catch (error) {
      toast.error(nonApplyActionError(error instanceof Error ? error.message : undefined, action));
    } finally {
      setNonApplyAction(null);
    }
  };

  const resetDraft = () => {
    if (!baselineDraft) return;
    setDraft(baselineDraft);
  };

  const applyAllReviewedVesting = async () => {
    setBulkApplying(true);
    setBulkProgress({ done: 0, failed: 0, total: 0, current: "" });
    try {
      const cases = await fetchAllOpenVestingReviewCases(filters.search || "");
      setBulkProgress({ done: 0, failed: 0, total: cases.length, current: "" });

      let failed = 0;
      for (let index = 0; index < cases.length; index += 1) {
        const reviewCase = cases[index];
        setBulkProgress({
          done: index,
          failed,
          total: cases.length,
          current: projectName(reviewCase),
        });
        const response = await approveFomoV2ReviewCase(
          reviewCase.id,
          "Bulk vesting review apply",
          true
        );
        if (!response.success) failed += 1;
        setBulkProgress({
          done: index + 1,
          failed,
          total: cases.length,
          current: projectName(reviewCase),
        });
      }

      if (failed) {
        toast.error(`${failed} of ${cases.length} vesting reviews failed`);
      } else {
        toast.success(`${cases.length} vesting reviews applied`);
      }
      setConfirmAllOpen(false);
      setSelectedCase(null);
      setDraft(null);
      setBaselineDraft(null);
      setConfirmedVesting(null);
      await loadCases({ ...filters, status: "open", page: 1 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply all vesting reviews");
    } finally {
      setBulkApplying(false);
    }
  };

  const importAllUnlocks = async () => {
    if (!window.confirm("Run write import for all Dropstab unlocks?")) return;
    setUnlockImporting(true);
    try {
      const response = await importFomoV2Unlocks();
      if (!response.success) {
        toast.error(response.error || "Failed to import unlocks");
        return;
      }
      setUnlockImportResult({ result: response.data, scope: "All projects" });
      toast.success(unlockImportToast(response.data));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import unlocks");
    } finally {
      setUnlockImporting(false);
    }
  };

  const importSelectedProjectUnlocks = async () => {
    if (!selectedCase || !draft) return;
    const project = projectName(selectedCase);
    if (!window.confirm(`Import unlocks into review draft for ${project}?`)) return;
    setProjectUnlockImporting(true);
    try {
      const response = await stageFomoV2ReviewCaseUnlocks(selectedCase.id);
      if (!response.success) {
        toast.error(response.error || "Failed to import project unlocks");
        return;
      }
      const stage = response.data.unlockStage;
      const reviewCase = response.data.reviewCase;
      setSelectedCase(reviewCase);
      setDraft((current) =>
        current ? mergeUnlockStageIntoDraft(current, stage.rawSource) : draftFromReviewCase(reviewCase)
      );
      setBaselineDraft((current) =>
        current ? mergeUnlockStageIntoDraft(current, stage.rawSource) : draftFromReviewCase(reviewCase)
      );
      setUnlockStageResult({ result: stage, scope: project });
      toast.success(unlockStageToast(stage));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import project unlocks");
    } finally {
      setProjectUnlockImporting(false);
    }
  };

  return (
    <Layout>
      <div className={classes.page}>
        <div className={classes.header}>
          <div>
            <h1>FOMO V2 vesting review</h1>
            <p>Open vesting cases: {formatNumber(total)}</p>
          </div>
          <div className={classes.headerActions}>
            <select
              value={filters.status || "open"}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="open">Open</option>
              <option value="approved">Approved</option>
              <option value="resolved">Resolved</option>
              <option value="">All</option>
            </select>
            <input
              value={filters.search || ""}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search project, source, id"
            />
            <button className={classes.button} onClick={() => loadCases()} disabled={loading}>
              Refresh
            </button>
            <button
              className={classes.primaryButton}
              onClick={importAllUnlocks}
              disabled={loading || bulkApplying || unlockImporting}
            >
              {unlockImporting ? "Importing unlocks..." : "Import Unlocks"}
            </button>
            <button
              className={classes.warningButton}
              onClick={() => setConfirmAllOpen(true)}
              disabled={loading || bulkApplying}
            >
              Confirm all
            </button>
          </div>
        </div>

        {unlockImportResult && (
          <UnlockImportResultPanel
            onClose={() => setUnlockImportResult(null)}
            result={unlockImportResult.result}
            scope={unlockImportResult.scope}
          />
        )}

        {unlockStageResult && (
          <UnlockStageResultPanel
            onClose={() => setUnlockStageResult(null)}
            result={unlockStageResult.result}
            scope={unlockStageResult.scope}
          />
        )}

        <div className={classes.workspace}>
          <aside className={classes.listPane}>
            <div className={classes.listHead}>
              <strong>{formatNumber(items.length)} visible</strong>
              {loading && <span>Loading</span>}
            </div>
            <div className={classes.caseList}>
              {items.map((reviewCase) => {
                const raw = rawSourceFor(reviewCase);
                const counts = rawCounts(raw);
                const active = selectedCase?.id === reviewCase.id;
                return (
                  <button
                    key={reviewCase.id}
                    className={`${classes.caseCard} ${active ? classes.caseCardActive : ""}`}
                    onClick={() => openCase(reviewCase)}
                  >
                    <ProjectIdentity project={reviewCase.canonicalProject} reviewCase={reviewCase} />
                    <div className={classes.caseCardMeta}>
                      <span>{reviewCase.sourceSlug || reviewCase.sourceId || reviewCase.source}</span>
                      <span>{reviewCase.type.replace(/_/g, " ")}</span>
                    </div>
                    <div className={classes.countGrid}>
                      <Count label="Rank" value={rankLabel(reviewCase.canonicalProject)} />
                      <Count label="Alloc" value={counts.tokenAllocation} />
                      <Count label="Rounds" value={counts.vestingRounds} />
                      <Count label="Schedules" value={counts.vestingSchedule || counts.vestingTimeline} />
                    </div>
                  </button>
                );
              })}
              {!loading && !items.length && (
                <div className={classes.empty}>No vesting review cases found.</div>
              )}
            </div>
            <div className={classes.pagination}>
              <button
                className={classes.button}
                disabled={Number(filters.page || 1) <= 1}
                onClick={() => updateFilter("page", Math.max(1, Number(filters.page || 1) - 1))}
              >
                Previous
              </button>
              <span>Page {filters.page || 1}</span>
              <button
                className={classes.button}
                disabled={items.length < Number(filters.limit || 100)}
                onClick={() => updateFilter("page", Number(filters.page || 1) + 1)}
              >
                Next
              </button>
            </div>
          </aside>

          <main className={classes.detailPane}>
            {!selectedCase || !draft ? (
              <div className={classes.emptyState}>Select a project to review vesting.</div>
            ) : (
              <>
                <div className={classes.projectHeader}>
                  <ProjectIdentity project={selectedCase.canonicalProject} reviewCase={selectedCase} large />
                  <div className={classes.projectHeaderActions}>
                    <div className={classes.projectBadges}>
                      <span>{selectedCase.status}</span>
                      <span>{selectedCase.source}</span>
                      {editingConfirmedVesting && <span className={classes.confirmedBadge}>Confirmed vesting</span>}
                      {draftIsEdited && <span className={classes.editedBadge}>Edited</span>}
                    </div>
                    <div className={classes.sourceActions}>
                      {dropstabUrl(selectedCase) && (
                        <a
                          className={classes.linkButton}
                          href={dropstabUrl(selectedCase)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open dropstab
                        </a>
                      )}
                      <button
                        className={classes.primaryButton}
                        onClick={importSelectedProjectUnlocks}
                        disabled={projectUnlockImporting || selectedCaseBusy}
                      >
                        {projectUnlockImporting ? "Importing..." : "Import Unlocks"}
                      </button>
                    </div>
                  </div>
                </div>

                {detailLoading && <div className={classes.notice}>Loading full vesting payload...</div>}
                {editingConfirmedVesting && !detailLoading && (
                  <div className={classes.notice}>
                    Editing confirmed vesting records saved for this project.
                  </div>
                )}

                <div className={classes.metrics}>
                  <Metric label="Allocations" value={selectedCounts.tokenAllocation} />
                  <Metric label="Rounds" value={selectedCounts.vestingRounds} />
                  <Metric label="Schedules" value={selectedCounts.vestingSchedule} />
                  <Metric label="Unlock events" value={selectedCounts.unlockingEvents} />
                </div>

                <SummaryPanel draft={draft} updateSummary={updateSummary} />

                <EditableTable
                  title="Token allocation"
                  table="tokenAllocation"
                  fields={ALLOCATION_FIELDS}
                  rows={draft.tokenAllocation}
                  addRow={addRow}
                  removeRow={removeRow}
                  updateRow={updateRow}
                />

                <EditableTable
                  title="Vesting rounds"
                  table="vestingRounds"
                  fields={ROUND_FIELDS}
                  rows={draft.vestingRounds}
                  addRow={addRow}
                  removeRow={removeRow}
                  updateRow={updateRow}
                />

                <EditableTable
                  title={`Vesting schedule (${draft.scheduleSourceKey})`}
                  table="vestingSchedule"
                  fields={SCHEDULE_FIELDS}
                  rows={draft.vestingSchedule}
                  addRow={addRow}
                  removeRow={removeRow}
                  updateRow={updateRow}
                  showBars
                />

                <div className={classes.applyBar}>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Decision note"
                  />
                  <div className={classes.applyActions}>
                    <div className={classes.applyPrimaryActions}>
                      <button className={classes.button} onClick={resetDraft} disabled={!draftIsEdited || selectedCaseBusy}>
                        Reset
                      </button>
                      <button className={classes.primaryButton} onClick={applySelected} disabled={selectedCaseBusy}>
                        {applying
                          ? "Saving..."
                          : editingConfirmedVesting
                            ? "Save confirmed vesting"
                            : "Apply vesting"}
                      </button>
                    </div>
                    <div className={classes.caseResolutionActions}>
                      <small>{NON_APPLY_ACTION_HINT}</small>
                      <div className={classes.caseResolutionButtons}>
                        <button
                          className={classes.secondaryButton}
                          disabled={selectedCaseBusy}
                          onClick={() => runNonApplyAction("reject")}
                          title={NON_APPLY_ACTION_HINT}
                        >
                          {nonApplyAction === "reject" ? "Rejecting..." : "Reject"}
                        </button>
                        <button
                          className={classes.mutedButton}
                          disabled={selectedCaseBusy}
                          onClick={() => runNonApplyAction("ignore")}
                          title={NON_APPLY_ACTION_HINT}
                        >
                          {nonApplyAction === "ignore" ? "Ignoring..." : "Ignore"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <details className={classes.rawDetails}>
                  <summary>Raw apply payload</summary>
                  <pre>{JSON.stringify(overrideFromDraft(draft), null, 2)}</pre>
                </details>
              </>
            )}
          </main>
        </div>

        {confirmAllOpen && (
          <>
            <div className={classes.modalBackdrop} onClick={() => (bulkApplying ? undefined : setConfirmAllOpen(false))} />
            <div className={classes.modal}>
              <h2>Confirm all vesting reviews</h2>
              <p>
                This will apply every open vesting review case
                {filters.search ? ` matching "${filters.search}"` : ""}.
              </p>
              <div className={classes.bulkProgress}>
                <span>
                  {bulkProgress.total
                    ? `${formatNumber(bulkProgress.done)} / ${formatNumber(bulkProgress.total)}`
                    : filters.status === "open"
                      ? `${formatNumber(total)} queued`
                      : "Open queue"}
                </span>
                {bulkProgress.current && <strong>{bulkProgress.current}</strong>}
                {bulkProgress.failed > 0 && <small>{formatNumber(bulkProgress.failed)} failed</small>}
              </div>
              <div className={classes.modalActions}>
                <button
                  className={classes.button}
                  onClick={() => setConfirmAllOpen(false)}
                  disabled={bulkApplying}
                >
                  Cancel
                </button>
                <button
                  className={classes.warningButton}
                  onClick={applyAllReviewedVesting}
                  disabled={bulkApplying}
                >
                  {bulkApplying ? "Applying..." : "Confirm all"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

const UnlockImportResultPanel = ({
  onClose,
  result,
  scope,
}: {
  onClose: () => void;
  result: FomoV2UnlockImportResult;
  scope: string;
}) => {
  const classes = useStyles();
  const summary = [
    ["Scope", scope],
    ["Mode", `${result.mode} / ${result.unlocksMode}`],
    ["Scanned", result.scannedProjects],
    ["Linked projects", result.projectsWithCanonicalId],
    ["Source events", result.sourceEventsFound],
    ["Created", result.eventsCreated],
    ["Updated", result.eventsUpdated],
    ["Unchanged", result.eventsUnchanged],
    ["Skipped", result.eventsSkipped],
    ["Warnings", result.warnings?.length || result.resolveWarnings || 0],
    ["Errors", result.errors?.length || 0],
  ];

  return (
    <section className={classes.importResult}>
      <div className={classes.sectionHead}>
        <h2>Unlock import result</h2>
        <button className={classes.button} onClick={onClose}>
          Close
        </button>
      </div>
      <div className={classes.importResultGrid}>
        {summary.map(([label, value]) => (
          <div key={String(label)}>
            <span>{label}</span>
            <strong>{typeof value === "number" ? formatNumber(value) : String(value)}</strong>
          </div>
        ))}
      </div>
      {!!result.warnings?.length && (
        <details className={classes.rawDetails}>
          <summary>Warnings ({formatNumber(result.warnings.length)})</summary>
          <pre>{JSON.stringify(result.warnings, null, 2)}</pre>
        </details>
      )}
      {!!result.errors?.length && (
        <details className={classes.rawDetails}>
          <summary>Errors ({formatNumber(result.errors.length)})</summary>
          <pre>{JSON.stringify(result.errors, null, 2)}</pre>
        </details>
      )}
      <details className={classes.rawDetails} open>
        <summary>Full result JSON</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </section>
  );
};

const UnlockStageResultPanel = ({
  onClose,
  result,
  scope,
}: {
  onClose: () => void;
  result: FomoV2UnlockStageResult;
  scope: string;
}) => {
  const classes = useStyles();
  const summary = [
    ["Scope", scope],
    ["Mode", result.mode],
    ["Source", result.sourceType],
    ["Events", result.counts.unlockingEvents],
    ["Event rows", result.counts.unlockingEventRows],
    ["Next event", result.counts.nextUnlockingEvent],
    ["Total rows", result.counts.totalRows],
    ["Warnings", result.warnings?.length || 0],
  ];

  return (
    <section className={classes.importResult}>
      <div className={classes.sectionHead}>
        <h2>Unlocks staged in review</h2>
        <button className={classes.button} onClick={onClose}>
          Close
        </button>
      </div>
      <div className={classes.importResultGrid}>
        {summary.map(([label, value]) => (
          <div key={String(label)}>
            <span>{label}</span>
            <strong>{typeof value === "number" ? formatNumber(value) : String(value)}</strong>
          </div>
        ))}
      </div>
      {!!result.warnings?.length && (
        <details className={classes.rawDetails}>
          <summary>Warnings ({formatNumber(result.warnings.length)})</summary>
          <pre>{JSON.stringify(result.warnings, null, 2)}</pre>
        </details>
      )}
      <details className={classes.rawDetails} open>
        <summary>Staged raw unlocks</summary>
        <pre>{JSON.stringify(result.rawSource, null, 2)}</pre>
      </details>
    </section>
  );
};

const SummaryPanel = ({
  draft,
  updateSummary,
}: {
  draft: VestingDraft;
  updateSummary: (key: string, value: string) => void;
}) => {
  const classes = useStyles();
  const unlocked = percentValue(draft.vestingSummary.unlockedPercent);
  const locked = percentValue(draft.vestingSummary.lockedPercent);
  const untracked = percentValue(draft.vestingSummary.untrackedPercent);
  return (
    <section className={classes.section}>
      <div className={classes.sectionHead}>
        <h2>Vesting summary</h2>
      </div>
      <div className={classes.summaryBand}>
        <div className={classes.progressBar}>
          <span className={classes.unlockedBar} style={{ width: `${unlocked}%` }} />
          <span className={classes.lockedBar} style={{ width: `${locked}%` }} />
          <span className={classes.untrackedBar} style={{ width: `${untracked}%` }} />
        </div>
        <div className={classes.summaryLegend}>
          <span>Unlocked {formatPercent(unlocked)}</span>
          <span>Locked {formatPercent(locked)}</span>
          <span>Untracked {formatPercent(untracked)}</span>
        </div>
      </div>
      <div className={classes.summaryGrid}>
        {SUMMARY_FIELDS.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              type={field.kind === "date" ? "date" : "text"}
              inputMode={field.kind === "number" ? "decimal" : undefined}
              value={inputValue(draft.vestingSummary[field.key], field)}
              onChange={(event) => updateSummary(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
};

const EditableTable = ({
  title,
  table,
  fields,
  rows,
  showBars,
  addRow,
  removeRow,
  updateRow,
}: {
  title: string;
  table: DraftTableKey;
  fields: FieldDefinition[];
  rows: RawRecord[];
  showBars?: boolean;
  addRow: (table: DraftTableKey) => void;
  removeRow: (table: DraftTableKey, rowIndex: number) => void;
  updateRow: (table: DraftTableKey, rowIndex: number, key: string, value: string) => void;
}) => {
  const classes = useStyles();
  return (
    <section className={classes.section}>
      <div className={classes.sectionHead}>
        <h2>{title}</h2>
        <button className={classes.button} onClick={() => addRow(table)}>
          Add row
        </button>
      </div>
      <div className={classes.tableWrap}>
        <table className={classes.editTable}>
          <thead>
            <tr>
              {showBars && <th style={{ minWidth: 110 }}>Progress</th>}
              {fields.map((field) => (
                <th key={field.key} style={{ minWidth: field.minWidth || 110 }}>
                  {field.label}
                </th>
              ))}
              <th style={{ minWidth: 72 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {showBars && (
                  <td>
                    <MiniProgress
                      unlocked={row.currentUnlockedPercent ?? row.vestedPercent}
                      locked={row.currentLockedPercent ?? row.lockedPercent}
                    />
                  </td>
                )}
                {fields.map((field) => (
                  <td key={field.key}>
                    <input
                      type={field.kind === "date" ? "date" : "text"}
                      inputMode={field.kind === "number" ? "decimal" : undefined}
                      value={inputValue(row[field.key], field)}
                      onChange={(event) => updateRow(table, rowIndex, field.key, event.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button className={classes.removeButton} onClick={() => removeRow(table, rowIndex)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={fields.length + (showBars ? 2 : 1)} className={classes.tableEmpty}>
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const MiniProgress = ({ unlocked, locked }: { unlocked: unknown; locked: unknown }) => {
  const classes = useStyles();
  const unlockedPercent = percentValue(unlocked);
  const lockedPercent = percentValue(locked);
  return (
    <div>
      <div className={classes.miniBar}>
        <span className={classes.unlockedBar} style={{ width: `${unlockedPercent}%` }} />
        <span className={classes.lockedBar} style={{ width: `${lockedPercent}%` }} />
      </div>
      <small>
        {formatPercent(unlockedPercent)} / {formatPercent(lockedPercent)}
      </small>
    </div>
  );
};

const ProjectIdentity = ({
  project,
  reviewCase,
  large,
}: {
  project?: FomoV2ProjectSummary;
  reviewCase: FomoV2ReviewCase;
  large?: boolean;
}) => {
  const classes = useStyles();
  const [imageFailed, setImageFailed] = useState(false);
  const symbol = projectSymbol(reviewCase);
  const logo = projectLogo(project);
  const details = [symbol, rankLabel(project)].filter(Boolean).join(" - ");
  return (
    <div className={`${classes.projectIdentity} ${large ? classes.projectIdentityLarge : ""}`}>
      <div className={classes.logoBox}>
        {logo && !imageFailed ? (
          <img src={logo} alt={projectName(reviewCase)} onError={() => setImageFailed(true)} />
        ) : (
          <span>{symbol.slice(0, 3) || projectName(reviewCase).slice(0, 2)}</span>
        )}
      </div>
      <div>
        <strong>{projectName(reviewCase)}</strong>
        <small>{details || reviewCase.sourceSlug || reviewCase.sourceId || "-"}</small>
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: unknown }) => {
  const classes = useStyles();
  return (
    <div className={classes.metric}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
};

const Count = ({ label, value }: { label: string; value: unknown }) => (
  <span>
    {label} <strong>{formatMetricValue(value)}</strong>
  </span>
);

async function fetchAllOpenVestingReviewCases(search?: string) {
  const baseFilters: FomoV2ReviewCaseFilters = {
    status: "open",
    domain: "vesting",
    type: VESTING_REVIEW_TYPES,
    sort: "project_rank",
    search: search || "",
    page: 1,
    limit: BULK_PAGE_LIMIT,
  };
  const firstResponse = await fetchFomoV2ReviewCases(baseFilters);
  if (!firstResponse.success) {
    throw new Error(firstResponse.error || "Failed to load vesting review cases");
  }

  const cases = [...firstResponse.data.items.filter(isVestingApplyCase)];
  const pages = Number(firstResponse.data.pages || 1);
  for (let page = 2; page <= pages; page += 1) {
    const response = await fetchFomoV2ReviewCases({
      ...baseFilters,
      page,
    });
    if (!response.success) {
      throw new Error(response.error || `Failed to load vesting review page ${page}`);
    }
    cases.push(...response.data.items.filter(isVestingApplyCase));
  }
  return cases;
}

function isVestingApplyCase(reviewCase: FomoV2ReviewCase) {
  const supportedType = ["vesting_component_relation_review", "existing_vesting_source"].includes(
    reviewCase.type
  );
  return (
    reviewCase.domain === "vesting" &&
    supportedType &&
    (reviewCase.suggestedAction === "review_and_create_vesting_records" ||
      reviewCase.status === "approved" ||
      Boolean(reviewCase.canonicalProject?.isVestingReview))
  );
}

function shouldLoadConfirmedVesting(reviewCase: FomoV2ReviewCase) {
  return Boolean(
    reviewCase.canonicalProjectId &&
      (reviewCase.status === "approved" || reviewCase.canonicalProject?.isVestingReview)
  );
}

function mergeSelectedProject(
  current: FomoV2ReviewCase | null,
  project?: FomoV2ProjectSummary
): FomoV2ReviewCase | null {
  if (!current) return current;
  const projectId = project?.id || current.canonicalProject?.id;
  if (!projectId) return current;
  return {
    ...current,
    canonicalProject: {
      id: projectId,
      ...(current.canonicalProject || {}),
      ...(project || {}),
      isVestingReview: true,
    },
  };
}

function draftFromReviewCase(reviewCase: FomoV2ReviewCase): VestingDraft {
  return draftFromRawSource(rawSourceFor(reviewCase));
}

function draftFromRawSource(rawInput: unknown): VestingDraft {
  const raw = toRecord(rawInput);
  const vestingSchedule = toRecordArray(raw.vestingSchedule);
  const vestingTimeline = toRecordArray(raw.vestingTimeline);
  const scheduleSourceKey = vestingSchedule.length ? "vestingSchedule" : "vestingTimeline";
  return {
    tokenAllocation: sortTokenAllocations(toRecordArray(raw.tokenAllocation)),
    vestingRounds: toRecordArray(raw.vestingRounds),
    vestingSchedule: scheduleSourceKey === "vestingSchedule" ? vestingSchedule : vestingTimeline,
    vestingSummary: toRecord(raw.vestingSummary),
    scheduleSourceKey,
    extras: {
      vestingTimeline,
      unlockingEvents: toRecordArray(raw.unlockingEvents),
      nextUnlockingEvent: toOptionalRecord(raw.nextUnlockingEvent),
      publicVesting: toRecordArray(raw.publicVesting),
    },
  };
}

function mergeUnlockStageIntoDraft(
  current: VestingDraft,
  rawSource: FomoV2UnlockStageResult["rawSource"]
): VestingDraft {
  return {
    ...current,
    extras: {
      ...current.extras,
      unlockingEvents: toRecordArray(rawSource.unlockingEvents),
      nextUnlockingEvent: toOptionalRecord(rawSource.nextUnlockingEvent),
    },
  };
}

function overrideFromDraft(draft: VestingDraft): FomoV2VestingOverridePayload {
  const payload: FomoV2VestingOverridePayload = {
    tokenAllocation: cleanRows(draft.tokenAllocation),
    vestingRounds: cleanRows(draft.vestingRounds),
    vestingSummary: cleanRecord(draft.vestingSummary),
  };
  const schedules = cleanRows(draft.vestingSchedule);
  if (draft.scheduleSourceKey === "vestingTimeline") {
    payload.vestingTimeline = schedules;
  } else {
    payload.vestingSchedule = schedules;
    if (draft.extras.vestingTimeline?.length) payload.vestingTimeline = draft.extras.vestingTimeline;
  }
  if (draft.extras.unlockingEvents?.length) payload.unlockingEvents = draft.extras.unlockingEvents;
  if (draft.extras.nextUnlockingEvent && Object.keys(draft.extras.nextUnlockingEvent).length) {
    payload.nextUnlockingEvent = cleanRecord(draft.extras.nextUnlockingEvent);
  }
  if (draft.extras.publicVesting?.length) payload.publicVesting = draft.extras.publicVesting;
  return payload;
}

function rawSourceFor(reviewCase: FomoV2ReviewCase): RawRecord {
  const payload = toRecord(reviewCase.payload);
  return toRecord(payload.rawSource);
}

function rawCounts(raw: RawRecord) {
  return {
    tokenAllocation: toRecordArray(raw.tokenAllocation).length,
    vestingRounds: toRecordArray(raw.vestingRounds).length,
    vestingSchedule: toRecordArray(raw.vestingSchedule).length,
    vestingTimeline: toRecordArray(raw.vestingTimeline).length,
    unlockingEvents:
      toRecordArray(raw.unlockingEvents).length +
      (Object.keys(toRecord(raw.nextUnlockingEvent)).length ? 1 : 0),
  };
}

function sortTokenAllocations(rows: RawRecord[]) {
  return [...rows].sort((left, right) => {
    const leftPercent = firstSortableNumber(
      left.percent,
      left.allocationPercent,
      left.tokensAllocatedPercent,
      left.tokensForSalePercent
    );
    const rightPercent = firstSortableNumber(
      right.percent,
      right.allocationPercent,
      right.tokensAllocatedPercent,
      right.tokensForSalePercent
    );
    if (leftPercent !== rightPercent) return rightPercent - leftPercent;

    const leftAmount = firstSortableNumber(
      left.amount,
      left.tokensAmount,
      left.tokensAllocatedAmount,
      left.tokensForSaleAmount
    );
    const rightAmount = firstSortableNumber(
      right.amount,
      right.tokensAmount,
      right.tokensAllocatedAmount,
      right.tokensForSaleAmount
    );
    return rightAmount - leftAmount;
  });
}

function firstSortableNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function draftCounts(current: VestingDraft) {
  return {
    tokenAllocation: current.tokenAllocation.length,
    vestingRounds: current.vestingRounds.length,
    vestingSchedule: current.vestingSchedule.length,
    unlockingEvents:
      (current.extras.unlockingEvents?.length || 0) +
      (current.extras.nextUnlockingEvent && Object.keys(current.extras.nextUnlockingEvent).length ? 1 : 0),
  };
}

function emptyCounts() {
  return {
    tokenAllocation: 0,
    vestingRounds: 0,
    vestingSchedule: 0,
    unlockingEvents: 0,
  };
}

function emptyRowFor(table: DraftTableKey): RawRecord {
  if (table === "tokenAllocation") {
    return { name: "", saleId: "", percent: "", amount: "" };
  }
  if (table === "vestingRounds") {
    return { roundName: "", saleId: "", totalAmount: "" };
  }
  return { roundName: "", saleId: "", tgeUnlockPercent: "", vestingType: "", vestingFrequency: "" };
}

function cleanRows(rows: RawRecord[]) {
  return rows.map(cleanRecord).filter((row) => Object.keys(row).length);
}

function cleanRecord(record: RawRecord): RawRecord {
  return Object.entries(record).reduce<RawRecord>((result, [key, value]) => {
    const cleaned = cleanDraftValue(key, value);
    if (cleaned !== undefined) result[key] = cleaned;
    return result;
  }, {});
}

function cleanDraftValue(key: string, value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return undefined;
    if (NUMERIC_FIELDS.has(key) || key === "saleId") {
      const parsed = Number(text);
      return Number.isFinite(parsed) ? parsed : text;
    }
    return text;
  }
  return value;
}

function inputValue(value: unknown, field: FieldDefinition) {
  if (value === undefined || value === null) return "";
  if (field.kind === "date") return dateInputValue(value);
  return String(value);
}

function dateInputValue(value: unknown) {
  const text = String(value || "");
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function toRecord(value: unknown): RawRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as RawRecord;
}

function toOptionalRecord(value: unknown): RawRecord | undefined {
  const record = toRecord(value);
  return Object.keys(record).length ? record : undefined;
}

function toRecordArray(value: unknown): RawRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object" && !Array.isArray(item)) as RawRecord[];
}

function projectName(reviewCase: FomoV2ReviewCase) {
  return (
    reviewCase.canonicalProject?.name ||
    reviewCase.canonicalProject?.canonicalName ||
    reviewCase.payload?.projectName ||
    reviewCase.sourceSlug ||
    reviewCase.title ||
    "Unknown project"
  ).toString();
}

function projectSymbol(reviewCase: FomoV2ReviewCase) {
  return String(reviewCase.canonicalProject?.symbol || "").toUpperCase();
}

function projectLogo(project?: FomoV2ProjectSummary) {
  return project?.logoUrl ? loader(project.logoUrl) : "";
}

function dropstabUrl(reviewCase: FomoV2ReviewCase) {
  const sourceUrl = String(reviewCase.sourceUrl || "").trim();
  if (sourceUrl) return sourceUrl;
  const source = String(reviewCase.source || "").trim().toLowerCase();
  const slug = String(reviewCase.sourceSlug || "").trim();
  if (source === "dropstab" && slug) return `https://dropstab.com/coins/${slug}`;
  return "";
}

function rankLabel(project?: FomoV2ProjectSummary) {
  const rank = Number(project?.rank);
  return Number.isFinite(rank) && rank > 0 ? `#${rank}` : "-";
}

function formatNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-US") : "0";
}

function formatMetricValue(value: unknown) {
  if (typeof value === "string" && value.trim() && Number.isNaN(Number(value))) {
    return value;
  }
  return formatNumber(value);
}

function percentValue(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function formatPercent(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)}%` : "0.00%";
}

function unlockImportToast(result: FomoV2UnlockImportResult) {
  return [
    `${formatNumber(result.eventsCreated)} created`,
    `${formatNumber(result.eventsUpdated)} updated`,
    `${formatNumber(result.eventsUnchanged)} unchanged`,
    `${formatNumber(result.eventsSkipped)} skipped`,
  ].join(" / ");
}

function unlockStageToast(result: FomoV2UnlockStageResult) {
  return [
    `${formatNumber(result.counts.totalRows)} unlock rows staged`,
    `${formatNumber(result.counts.unlockingEvents)} events`,
    `${formatNumber(result.counts.nextUnlockingEvent)} next`,
  ].join(" / ");
}

export default FomoV2VestingReviewPage;
