import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  CryptoLinkingConfidence,
  CryptoLinkingEntityType,
  CryptoLinkingProgressJob,
  fetchCryptoLinkingBatch,
  fetchCryptoLinkingHistory,
  fetchCryptoLinkingProgress,
  startCryptoLinkingApplyJob,
  startCryptoLinkingAuditJob,
} from "../../services/cryptoLinking";
import { useStyles } from "./styles";

type LoadingState = "audit" | "preview" | "apply" | "batch" | null;

type FormState = {
  scanLimit: number;
  investorScanLimit: number;
  sampleLimit: number;
  applyLimit: number;
  fundingRounds: boolean;
  tokenUnlocks: boolean;
  allowHigh: boolean;
  confirmApply: boolean;
};

type NumberField = "scanLimit" | "investorScanLimit" | "sampleLimit" | "applyLimit";

const defaultForm: FormState = {
  scanLimit: 1000,
  investorScanLimit: 50,
  sampleLimit: 20,
  applyLimit: 1,
  fundingRounds: true,
  tokenUnlocks: true,
  allowHigh: false,
  confirmApply: false,
};

const numberValue = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const displayNumber = (value: any) => numberValue(value).toLocaleString("en-US");

const listLength = (value: any) => (Array.isArray(value) ? value.length : numberValue(value));

const RAW_ARRAY_PREVIEW_LIMIT = 20;

const stringifyRawPreview = (value: any) =>
  JSON.stringify(
    value,
    (_key, nextValue) => {
      if (Array.isArray(nextValue) && nextValue.length > RAW_ARRAY_PREVIEW_LIMIT) {
        return {
          total: nextValue.length,
          shown: RAW_ARRAY_PREVIEW_LIMIT,
          items: nextValue.slice(0, RAW_ARRAY_PREVIEW_LIMIT),
        };
      }

      return nextValue;
    },
    2
  );

const trimId = (value: any) => {
  const text = String(value || "");
  if (text.length <= 14) return text || "-";
  return `${text.slice(0, 8)}...${text.slice(-5)}`;
};

const buildMetricRows = (source: any) =>
  Object.entries(source || {}).map(([label, value]) => ({
    label,
    value: displayNumber(value),
  }));

const countAllowedProposals = (items: any, allowHigh: boolean) => {
  if (!Array.isArray(items)) return 0;
  const allowed = allowHigh ? ["exact", "high"] : ["exact"];
  return items.filter((item) => allowed.includes(String(item?.confidence || ""))).length;
};

const deriveLimitValues = (report: any, form: FormState) => {
  const proposed = report?.proposedUpdates || {};
  const fundingApplyLimit = form.fundingRounds
    ? countAllowedProposals(proposed.fundingRounds, form.allowHigh)
    : 0;
  const unlockApplyLimit = form.tokenUnlocks
    ? countAllowedProposals(proposed.tokenUnlocks, form.allowHigh)
    : 0;
  const fundingResolution = report?.diagnostics?.fundingResolution || {};
  const unlockResolution = report?.diagnostics?.unlockResolution || {};
  const investorResolution = report?.diagnostics?.investorResolution || {};
  const scanLimit = Math.max(
    numberValue(report?.limits?.scanLimit),
    numberValue(report?.totals?.fundraising),
    numberValue(report?.totals?.unlocks),
    numberValue(fundingResolution.scanned),
    numberValue(unlockResolution.scanned)
  );
  const investorScanLimit = Math.max(
    numberValue(report?.limits?.investorScanLimit),
    numberValue(report?.diagnostics?.investorSourceRows),
    numberValue(investorResolution.scanned),
    numberValue(investorResolution.exactOrHigh)
  );
  const sampleLimit = Math.max(
    numberValue(report?.limits?.sampleLimit),
    numberValue(fundingResolution.unresolved),
    numberValue(fundingResolution.ambiguous),
    numberValue(unlockResolution.unresolved),
    numberValue(unlockResolution.ambiguous),
    numberValue(investorResolution.unknown),
    numberValue(investorResolution.ambiguous),
    numberValue(investorResolution.lowConfidence)
  );

  return {
    scanLimit,
    investorScanLimit,
    sampleLimit,
    applyLimit: fundingApplyLimit + unlockApplyLimit,
  };
};

const summarizeHistoryResult = (job: CryptoLinkingProgressJob) => {
  const result = job.result || {};
  const summary = (job as any).resultSummary || {};
  if (job.type === "audit") {
    const proposed = result.proposedUpdates || {};
    const funding = listLength(proposed.fundingRounds) || numberValue(summary.proposedFundingRounds);
    const unlocks = listLength(proposed.tokenUnlocks) || numberValue(summary.proposedTokenUnlocks);
    const investors = listLength(proposed.investors) || numberValue(summary.proposedInvestors);
    return `F ${displayNumber(funding)} / U ${displayNumber(unlocks)} / I ${displayNumber(investors)}`;
  }

  const applied = result.applied || summary.applied || {};
  const skipped = result.skipped || summary.skipped || {};
  const skippedTotal =
    numberValue(skipped.alreadyLinked) + numberValue(skipped.conflict) + numberValue(skipped.limitReached);

  return `Applied F ${displayNumber(applied.fundingRounds)} / U ${displayNumber(applied.tokenUnlocks)}; skipped ${displayNumber(
    skippedTotal
  )}`;
};

const summarizeHistoryRequest = (job: CryptoLinkingProgressJob) => {
  const request = job.request || {};
  return [
    `scan ${displayNumber(request.scanLimit)}`,
    `investors ${displayNumber(request.investorScanLimit)}`,
    `sample ${displayNumber(request.sampleLimit)}`,
    job.type === "apply" ? `apply ${displayNumber(request.applyLimit)}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
};

const Metric = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: any;
  tone?: "good" | "warn" | "bad";
}) => {
  const classes = useStyles();
  const toneClass =
    tone === "good" ? classes.metricGood : tone === "warn" ? classes.metricWarn : tone === "bad" ? classes.metricBad : "";

  return (
    <div className={`${classes.metric} ${toneClass}`}>
      <span>{label}</span>
      <strong>{displayNumber(value)}</strong>
    </div>
  );
};

const StatusTag = ({ status }: { status: string }) => {
  const classes = useStyles();
  const statusClass =
    status === "applied"
      ? classes.statusApplied
      : status === "conflict" || status === "skippedConflict" || status === "failed"
        ? classes.statusConflict
        : "";

  return <span className={`${classes.statusTag} ${statusClass}`}>{status || "unknown"}</span>;
};

const EcosystemLayout = () => {
  const classes = useStyles();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [applyReport, setApplyReport] = useState<any>(null);
  const [batchReport, setBatchReport] = useState<any>(null);
  const [progressJob, setProgressJob] = useState<CryptoLinkingProgressJob | null>(null);
  const [historyJobs, setHistoryJobs] = useState<CryptoLinkingProgressJob[]>([]);
  const [batchId, setBatchId] = useState("");
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const entityTypes = useMemo<CryptoLinkingEntityType[]>(() => {
    const selected: CryptoLinkingEntityType[] = [];
    if (form.fundingRounds) selected.push("fundingRounds");
    if (form.tokenUnlocks) selected.push("tokenUnlocks");
    return selected;
  }, [form.fundingRounds, form.tokenUnlocks]);

  const allowedConfidence = useMemo<CryptoLinkingConfidence[]>(
    () => (form.allowHigh ? ["exact", "high"] : ["exact"]),
    [form.allowHigh]
  );

  const progressPercent = Math.min(100, Math.max(0, Math.trunc(progressJob?.progress || 0)));
  const isProgressSettled =
    progressJob?.status === "completed" || progressJob?.status === "failed" || progressJob?.stage === "completed";
  const limitValues = useMemo(() => deriveLimitValues(auditReport, form), [auditReport, form]);

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const setNumberField = (field: NumberField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: Math.max(0, Math.trunc(Number(value) || 0)),
    }));
  };

  const applyMaxValuesFromReport = (report: any) => {
    if (!report) return;

    setForm((prev) => {
      const nextLimits = deriveLimitValues(report, prev);

      return {
        ...prev,
        scanLimit: nextLimits.scanLimit || prev.scanLimit,
        investorScanLimit: nextLimits.investorScanLimit || prev.investorScanLimit,
        sampleLimit: nextLimits.sampleLimit || prev.sampleLimit,
        applyLimit: nextLimits.applyLimit || prev.applyLimit,
      };
    });
  };

  const loadHistory = async (showToast = false) => {
    try {
      const response = await fetchCryptoLinkingHistory(25);
      if (!response.success) throw new Error(response.error || "History request failed");

      const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
      setHistoryJobs(jobs);

      const latestAudit = jobs.find((job) => job.type === "audit" && job.status === "completed" && (job as any).hasResult);
      if (latestAudit && !auditReport) {
        const detailResponse = await fetchCryptoLinkingProgress(latestAudit.id);
        const detailJob = detailResponse.success ? detailResponse.data : latestAudit;
        if (detailJob.result) {
          setAuditReport(detailJob.result);
          applyMaxValuesFromReport(detailJob.result);
        }
      }

      const latestApply = jobs.find((job) => job.type === "apply" && job.status === "completed" && (job as any).hasResult);
      if (latestApply && !applyReport) {
        const detailResponse = await fetchCryptoLinkingProgress(latestApply.id);
        const detailJob = detailResponse.success ? detailResponse.data : latestApply;
        if (detailJob.result) {
          setApplyReport(detailJob.result);
          setBatchId(detailJob.result?.batchId || "");
        }
      }

      if (showToast) toast.success("History loaded");
    } catch (error: any) {
      if (showToast) toast.error(error?.message || "Failed to load history");
    }
  };

  useEffect(() => {
    loadHistory(false);
    return () => clearProgressTimer();
  }, []);

  useEffect(() => {
    if (!auditReport) return;

    setForm((prev) => {
      const nextApplyLimit = deriveLimitValues(auditReport, prev).applyLimit;
      if (!nextApplyLimit || prev.applyLimit === nextApplyLimit) return prev;
      return { ...prev, applyLimit: nextApplyLimit };
    });
  }, [auditReport, form.fundingRounds, form.tokenUnlocks, form.allowHigh]);

  const buildAuditPayload = () => ({
    dryRun: true,
    scanLimit: form.scanLimit,
    investorScanLimit: form.investorScanLimit,
    sampleLimit: form.sampleLimit,
  });

  const buildApplyPayload = () => ({
    scanLimit: form.scanLimit,
    investorScanLimit: form.investorScanLimit,
    sampleLimit: form.sampleLimit,
    applyLimit: form.applyLimit,
    entityTypes,
    allowedConfidence,
  });

  const pollProgress = async (
    jobId: string,
    onCompleted: (result: any, job: CryptoLinkingProgressJob) => Promise<void> | void
  ) => {
    clearProgressTimer();

    return new Promise<void>((resolve, reject) => {
      const tick = async () => {
        try {
          const response = await fetchCryptoLinkingProgress(jobId);
          if (!response.success) throw new Error(response.error || "Progress request failed");

          const job = response.data;
          setProgressJob(job);

          if (job.status === "completed") {
            clearProgressTimer();
            await onCompleted(job.result, job);
            resolve();
          }

          if (job.status === "failed") {
            clearProgressTimer();
            reject(new Error(job.error || "Crypto linking job failed"));
          }
        } catch (error) {
          clearProgressTimer();
          reject(error);
        }
      };

      progressTimerRef.current = setInterval(tick, 800);
      tick();
    });
  };

  const runAudit = async () => {
    setLoading("audit");
    setProgressJob({
      id: "",
      type: "audit",
      status: "queued",
      progress: 0,
      stage: "queued",
      message: "Starting audit job",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const response = await startCryptoLinkingAuditJob(buildAuditPayload());
      if (!response.success) throw new Error(response.error || "Audit failed");
      setProgressJob(response.data);

      await pollProgress(response.data.id, (result) => {
        setAuditReport(result);
        applyMaxValuesFromReport(result);
        loadHistory(false);
        toast.success("Ecosystem audit completed");
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to run audit");
    } finally {
      setLoading(null);
    }
  };

  const runPreview = async () => {
    if (!entityTypes.length) {
      toast.error("Select at least one entity type");
      return;
    }

    setLoading("preview");
    setProgressJob({
      id: "",
      type: "apply",
      status: "queued",
      progress: 0,
      stage: "queued",
      message: "Starting apply preview",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const response = await startCryptoLinkingApplyJob(buildApplyPayload(), false);
      if (!response.success) throw new Error(response.error || "Preview failed");
      setProgressJob(response.data);

      await pollProgress(response.data.id, (result) => {
        setApplyReport(result);
        setBatchId(result?.batchId || "");
        loadHistory(false);
        toast.success("Apply preview completed");
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to preview apply");
    } finally {
      setLoading(null);
    }
  };

  const runApply = async () => {
    if (!form.confirmApply) {
      toast.error("Confirm database write first");
      return;
    }

    if (!entityTypes.length) {
      toast.error("Select at least one entity type");
      return;
    }

    setLoading("apply");
    setProgressJob({
      id: "",
      type: "apply",
      status: "queued",
      progress: 0,
      stage: "queued",
      message: "Starting controlled apply",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const response = await startCryptoLinkingApplyJob(buildApplyPayload(), true);
      if (!response.success) throw new Error(response.error || "Apply failed");
      setProgressJob(response.data);

      await pollProgress(response.data.id, async (result) => {
        setApplyReport(result);
        setBatchId(result?.batchId || "");
        await loadHistory(false);
        toast.success("Controlled apply finished");

        if (result?.batchId) {
          await loadBatch(result.batchId, false);
        }
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to run controlled apply");
    } finally {
      setLoading(null);
    }
  };

  const loadBatch = async (nextBatchId = batchId, showToast = true) => {
    const cleanedBatchId = nextBatchId.trim();
    if (!cleanedBatchId) {
      toast.error("Batch ID is required");
      return;
    }

    setLoading("batch");
    try {
      const response = await fetchCryptoLinkingBatch(cleanedBatchId);
      if (!response.success) throw new Error(response.error || "Batch report failed");
      setBatchReport(response.data);
      if (showToast) toast.success("Batch report loaded");
    } catch (error: any) {
      toast.error(error?.message || "Failed to load batch report");
    } finally {
      setLoading(null);
    }
  };

  const loadHistoryJob = async (job: CryptoLinkingProgressJob) => {
    const detailResponse = await fetchCryptoLinkingProgress(job.id).catch(() => null);
    const selectedJob = detailResponse?.success ? detailResponse.data : job;

    setProgressJob(selectedJob);

    if (selectedJob.type === "audit" && selectedJob.result) {
      setAuditReport(selectedJob.result);
      applyMaxValuesFromReport(selectedJob.result);
      toast.success("Audit result loaded");
      return;
    }

    if (selectedJob.type === "apply" && selectedJob.result) {
      setApplyReport(selectedJob.result);
      setBatchId(selectedJob.result?.batchId || "");
      toast.success("Apply result loaded");
      return;
    }

    toast.info("Selected job has no result yet");
  };

  const auditProposed = auditReport?.proposedUpdates || {};
  const applyOperations = Array.isArray(applyReport?.operations) ? applyReport.operations.slice(0, 25) : [];
  const batchOperations = Array.isArray(batchReport?.sampleOperations)
    ? batchReport.sampleOperations
    : Array.isArray(batchReport?.operations)
      ? batchReport.operations.slice(0, 25)
      : [];
  const rawResponsePreview = useMemo(
    () =>
      stringifyRawPreview({
        auditReport,
        applyReport,
        batchReport,
      }),
    [auditReport, applyReport, batchReport]
  );

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <div>
          <h1>Ecosystem</h1>
          <p>Crypto entity linking audit, proposed projectId updates, and controlled exact-match apply.</p>
        </div>
        <div className={classes.headerStatus}>
          <strong>{loading ? "Running" : "Ready"}</strong>
          <span>{auditReport?.generatedAt ? `Last audit ${auditReport.generatedAt}` : "No audit loaded"}</span>
        </div>
      </div>

      <div className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Audit Controls</h2>
        </div>

        <div className={classes.controlsGrid}>
          <label className={classes.field}>
            Scan limit
            <input
              type="number"
              value={form.scanLimit}
              onChange={(event) => setNumberField("scanLimit", event.target.value)}
            />
            <span>Max {displayNumber(limitValues.scanLimit)} entities</span>
          </label>
          <label className={classes.field}>
            Investor scan limit
            <input
              type="number"
              value={form.investorScanLimit}
              onChange={(event) => setNumberField("investorScanLimit", event.target.value)}
            />
            <span>Max {displayNumber(limitValues.investorScanLimit)} investor links</span>
          </label>
          <label className={classes.field}>
            Sample limit
            <input
              type="number"
              value={form.sampleLimit}
              onChange={(event) => setNumberField("sampleLimit", event.target.value)}
            />
            <span>Max {displayNumber(limitValues.sampleLimit)} samples</span>
          </label>
          <label className={classes.field}>
            Apply limit
            <input
              type="number"
              value={form.applyLimit}
              onChange={(event) => setNumberField("applyLimit", event.target.value)}
            />
            <span>Max {displayNumber(limitValues.applyLimit)} updates</span>
          </label>
        </div>

        <div className={classes.switches}>
          <label className={classes.checkRow}>
            <input
              type="checkbox"
              checked={form.fundingRounds}
              onChange={() => setForm((prev) => ({ ...prev, fundingRounds: !prev.fundingRounds }))}
            />
            Funding rounds
          </label>
          <label className={classes.checkRow}>
            <input
              type="checkbox"
              checked={form.tokenUnlocks}
              onChange={() => setForm((prev) => ({ ...prev, tokenUnlocks: !prev.tokenUnlocks }))}
            />
            Token unlocks
          </label>
          <label className={classes.checkRow}>
            <input
              type="checkbox"
              checked={form.allowHigh}
              onChange={() => setForm((prev) => ({ ...prev, allowHigh: !prev.allowHigh }))}
            />
            Allow high confidence
          </label>
          <label className={classes.checkRow}>
            <input
              type="checkbox"
              checked={form.confirmApply}
              onChange={() => setForm((prev) => ({ ...prev, confirmApply: !prev.confirmApply }))}
            />
            Confirm DB write
          </label>
        </div>

        <div className={classes.actions}>
          <button className={classes.primaryButton} disabled={!!loading} onClick={runAudit}>
            {loading === "audit" ? "Running audit..." : "Run audit"}
          </button>
          <button className={classes.secondaryButton} disabled={!auditReport || !!loading} onClick={() => applyMaxValuesFromReport(auditReport)}>
            Use max values
          </button>
          <button className={classes.secondaryButton} disabled={!!loading} onClick={runPreview}>
            {loading === "preview" ? "Previewing..." : "Preview apply"}
          </button>
          <button
            className={classes.dangerButton}
            disabled={!!loading || !form.confirmApply}
            onClick={runApply}
          >
            {loading === "apply" ? "Applying..." : "Apply selected links"}
          </button>
        </div>

        {form.allowHigh ? (
          <div className={classes.warning}>
            High-confidence matches are included only when this checkbox is enabled. Investor apply remains disabled by
            the backend.
          </div>
        ) : null}

        {progressJob ? (
          <div className={classes.progressPanel}>
            <div className={classes.progressHeader}>
              <strong>{progressJob.stage || progressJob.status}</strong>
              <span>{progressPercent}%</span>
            </div>
            <div className={classes.progressTrack}>
              <div
                className={`${classes.progressFill} ${isProgressSettled ? classes.progressFillSettled : ""}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className={classes.progressMessage}>{progressJob.message || "Processing crypto linking job"}</p>
            <div className={classes.progressMeta}>
              <span>{progressJob.status}</span>
              {progressJob.id ? <span>{progressJob.id}</span> : null}
              {progressJob.meta?.processed !== undefined && progressJob.meta?.total !== undefined ? (
                <span>
                  {progressJob.meta.processed}/{progressJob.meta.total}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Run History</h2>
          <button className={classes.secondaryButton} disabled={!!loading} onClick={() => loadHistory(true)}>
            Refresh history
          </button>
        </div>

        {historyJobs.length ? (
          <div className={classes.historyList}>
            {historyJobs.map((job) => (
              <div className={classes.historyRow} key={job.id}>
                <div>
                  <strong>{job.type}</strong>
                  <span>{job.id}</span>
                </div>
                <div>
                  <StatusTag status={job.status} />
                  <span>{job.stage}</span>
                </div>
                <div>
                  <strong>{summarizeHistoryRequest(job)}</strong>
                  <span>{summarizeHistoryResult(job)}</span>
                </div>
                <div>
                  <strong>{job.completedAt || job.updatedAt}</strong>
                  <span>{job.message}</span>
                </div>
                <button className={classes.secondaryButton} onClick={() => loadHistoryJob(job)}>
                  Load
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={classes.emptyState}>No audit or apply runs in the current backend process.</div>
        )}
      </div>

      {auditReport ? (
        <>
          <div className={classes.panel}>
            <div className={classes.panelHeader}>
              <h2>Audit Totals</h2>
            </div>
            <div className={classes.metricsGrid}>
              <Metric label="Projects" value={auditReport?.totals?.projects} tone="good" />
              <Metric label="Funding rounds" value={auditReport?.totals?.fundraising} />
              <Metric label="Token unlocks" value={auditReport?.totals?.unlocks} />
              <Metric label="Linked" value={auditReport?.totals?.linked} tone="good" />
              <Metric label="Unlinked" value={auditReport?.totals?.unlinked} tone="warn" />
              <Metric label="Ambiguous" value={auditReport?.totals?.ambiguous} tone="warn" />
              <Metric label="Unsafe" value={auditReport?.totals?.unsafe} tone="bad" />
              <Metric label="Investors" value={auditReport?.totals?.investors} />
            </div>
          </div>

          <div className={classes.splitGrid}>
            <div className={classes.panel}>
              <div className={classes.panelHeader}>
                <h2>Missing Links</h2>
              </div>
              <div className={classes.list}>
                {buildMetricRows(auditReport?.missingLinks).map((item) => (
                  <div className={classes.listRow} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={classes.panel}>
              <div className={classes.panelHeader}>
                <h2>Proposed Updates</h2>
              </div>
              <div className={classes.metricsGrid}>
                <Metric label="Funding rounds" value={listLength(auditProposed.fundingRounds)} tone="good" />
                <Metric label="Token unlocks" value={listLength(auditProposed.tokenUnlocks)} tone="good" />
                <Metric label="Investors" value={listLength(auditProposed.investors)} />
                <Metric label="Investor unknown" value={auditReport?.diagnostics?.investorResolution?.unknown} tone="warn" />
              </div>
            </div>
          </div>

          <div className={classes.panel}>
            <div className={classes.panelHeader}>
              <h2>Resolver Diagnostics</h2>
            </div>
            <div className={classes.splitGrid}>
              <div className={classes.list}>
                {buildMetricRows(auditReport?.diagnostics?.fundingResolution).map((item) => (
                  <div className={classes.listRow} key={`funding-${item.label}`}>
                    <span>Funding {item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className={classes.list}>
                {buildMetricRows(auditReport?.diagnostics?.unlockResolution).map((item) => (
                  <div className={classes.listRow} key={`unlock-${item.label}`}>
                    <span>Unlock {item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={classes.emptyState}>Run audit to load ecosystem linking diagnostics.</div>
      )}

      {applyReport ? (
        <div className={classes.panel}>
          <div className={classes.panelHeader}>
            <h2>{applyReport.apply ? "Apply Result" : "Apply Preview"}</h2>
            <span>Batch {applyReport.batchId || "-"}</span>
          </div>

          {Array.isArray(applyReport.safetyWarnings) && applyReport.safetyWarnings.length ? (
            <div className={classes.warning}>{applyReport.safetyWarnings.join(" ")}</div>
          ) : null}

          <div className={classes.metricsGrid}>
            <Metric label="Proposed funding" value={applyReport?.proposed?.fundingRounds} />
            <Metric label="Proposed unlocks" value={applyReport?.proposed?.tokenUnlocks} />
            <Metric label="Applied funding" value={applyReport?.applied?.fundingRounds} tone="good" />
            <Metric label="Applied unlocks" value={applyReport?.applied?.tokenUnlocks} tone="good" />
            <Metric label="Already linked" value={applyReport?.skipped?.alreadyLinked} />
            <Metric label="Conflicts" value={applyReport?.skipped?.conflict} tone="bad" />
            <Metric label="Limit reached" value={applyReport?.skipped?.limitReached} tone="warn" />
            <Metric label="Failed" value={applyReport?.failed} tone="bad" />
          </div>

          {applyOperations.length ? (
            <div className={classes.table}>
              <div className={classes.tableHead}>
                <div>Entity</div>
                <div>ID</div>
                <div>Status</div>
                <div>Project</div>
                <div>Matched by</div>
              </div>
              {applyOperations.map((operation: any, index: number) => (
                <div className={classes.tableRow} key={`${operation.entityId}-${index}`}>
                  <div>{operation.entityType}</div>
                  <div title={operation.entityId}>{trimId(operation.entityId)}</div>
                  <div>
                    <StatusTag status={operation.status} />
                  </div>
                  <div title={operation.projectId}>{trimId(operation.projectId)}</div>
                  <div title={operation.reason}>{operation.matchedBy || "-"}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Batch Report</h2>
        </div>
        <div className={classes.batchSearch}>
          <input
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
            placeholder="crypto-linking-YYYYMMDD-HHmmss"
          />
          <button className={classes.secondaryButton} disabled={!!loading} onClick={() => loadBatch()}>
            {loading === "batch" ? "Loading..." : "Load batch"}
          </button>
        </div>

        {batchReport ? (
          <>
            <div className={classes.metricsGrid}>
              <Metric label="Applied" value={batchReport?.totals?.applied} tone="good" />
              <Metric label="Skipped" value={batchReport?.totals?.skipped} />
              <Metric label="Conflict" value={batchReport?.totals?.conflict} tone="bad" />
              <Metric label="Failed" value={batchReport?.totals?.failed} tone="bad" />
            </div>

            {batchOperations.length ? (
              <div className={classes.table}>
                <div className={classes.tableHead}>
                  <div>Entity</div>
                  <div>ID</div>
                  <div>Status</div>
                  <div>Target</div>
                  <div>Time</div>
                </div>
                {batchOperations.slice(0, 25).map((operation: any, index: number) => (
                  <div className={classes.tableRow} key={`${operation.entityId}-${index}`}>
                    <div>{operation.entityType}</div>
                    <div title={operation.entityId}>{trimId(operation.entityId)}</div>
                    <div>
                      <StatusTag status={operation.status} />
                    </div>
                    <div title={operation.targetEntityId}>{trimId(operation.targetEntityId)}</div>
                    <div>{operation.createdAt || "-"}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {auditReport || applyReport || batchReport ? (
        <div className={classes.panel}>
          <details className={classes.details}>
            <summary>Raw response</summary>
            <pre className={classes.jsonBlock}>{rawResponsePreview}</pre>
          </details>
        </div>
      ) : null}
    </div>
  );
};

export default EcosystemLayout;
