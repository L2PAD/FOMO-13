import React, { MouseEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../../components/layouts/main_layout/layout";
import {
  approveFomoV2ReviewCase,
  fetchFomoV2ReviewCase,
  fetchFomoV2ReviewCases,
  FomoV2ReviewCase,
  FomoV2ReviewCaseFilters,
  FomoV2ReviewCaseListResponse,
  FomoV2ProjectSummary,
  generateFomoV2ReviewCases,
  ignoreFomoV2ReviewCase,
  rejectFomoV2ReviewCase,
  sendFomoV2ReviewCaseToParser,
} from "../../../components/services/fomoV2ReviewCases";
import { useStyles } from "./styles";

const DOMAINS = [
  { label: "All", value: "" },
  { label: "Identity", value: "identity" },
  { label: "Funding", value: "funding" },
  { label: "Allocation", value: "allocation" },
  { label: "Vesting", value: "vesting" },
  { label: "Unlock", value: "unlock" },
  { label: "Source", value: "source" },
];

const STATUSES = ["", "open", "approved", "rejected", "sent_to_parser", "resolved", "ignored"];
const SEVERITIES = ["", "high", "medium", "low"];
const SOURCES = ["", "system", "icodrops", "dropstab", "coinmarketcap", "coingecko", "manual"];
const VESTING_REVIEW_PATH = "/projects/fomo-v2/vesting-review";
const VESTING_APPLY_REVIEW_TYPES = [
  "existing_vesting_source",
  "vesting_component_relation_review",
];
const GENERAL_REVIEW_EXCLUDED_TYPES = VESTING_APPLY_REVIEW_TYPES.join(",");
const REVIEW_TYPES = [
  "",
  "missing_canonical_project",
  "ambiguous_canonical_match",
  "medium_alias_candidate",
  "duplicate_ico_only_canonical_candidate",
  "symbol_collision",
  "name_collision",
  "funding_round_source_conflict",
  "ambiguous_weak_backer",
  "unresolved_backer",
  "funding_round_duplicate_conflict",
  "allocation_category_percent_conflict",
  "incomplete_allocation_snapshot",
  "allocation_row_conflict",
  "category_alias_candidate",
  "missing_allocation_link",
  "missing_vesting_schedule_link",
  "vesting_component_relation_review",
  "existing_vesting_source",
  "unlock_missing_canonical",
  "aggregate_compacted_unlock_needing_review",
  "vesting_unknown_date",
  "vesting_allocation_category_conflict",
  "source_conflict",
  "low_confidence_evidence",
  "parser_data_quality_warning",
];

const QUICK_FILTERS: Array<{
  key: string;
  label: string;
  filters: Partial<FomoV2ReviewCaseFilters>;
}> = [
  {
    key: "open-high",
    label: "Open High Priority",
    filters: { status: "open", severity: "high", type: "", domain: "", source: "", search: "", canonicalProjectId: "" },
  },
  {
    key: "missing-canonical",
    label: "Missing Canonical",
    filters: {
      status: "open",
      severity: "",
      type: "missing_canonical_project,unlock_missing_canonical",
      domain: "",
      source: "",
      search: "",
      canonicalProjectId: "",
    },
  },
  {
    key: "source-conflicts",
    label: "Source Conflicts",
    filters: {
      status: "open",
      severity: "",
      type: "source_conflict,funding_round_source_conflict,allocation_category_percent_conflict,allocation_row_conflict,vesting_allocation_category_conflict",
      domain: "",
      source: "",
      search: "",
      canonicalProjectId: "",
    },
  },
  {
    key: "unresolved-backers",
    label: "Unresolved Backers",
    filters: {
      status: "open",
      severity: "",
      type: "unresolved_backer,ambiguous_weak_backer",
      domain: "funding",
      source: "",
      search: "",
      canonicalProjectId: "",
    },
  },
  {
    key: "unlock-missing-links",
    label: "Unlock Missing Links",
    filters: {
      status: "open",
      severity: "",
      type: "missing_allocation_link,missing_vesting_schedule_link",
      domain: "",
      source: "",
      search: "",
      canonicalProjectId: "",
    },
  },
  {
    key: "category-alias",
    label: "Category Aliases",
    filters: {
      status: "open",
      severity: "",
      type: "category_alias_candidate",
      domain: "",
      source: "dropstab",
      search: "",
      canonicalProjectId: "",
    },
  },
];

const displayNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-US") : "0";
};

const pretty = (value: unknown) => String(value || "-").replace(/_/g, " ");

const shortId = (value: unknown) => {
  const text = String(value || "");
  if (!text) return "-";
  if (text.length <= 18) return text;
  return `${text.slice(0, 8)}...${text.slice(-5)}`;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Metric = ({ label, value }: { label: string; value: unknown }) => {
  const classes = useStyles();
  return (
    <div className={classes.metric}>
      <span>{label}</span>
      <strong>{displayNumber(value)}</strong>
    </div>
  );
};

const JsonBlock = ({ value }: { value: unknown }) => {
  const classes = useStyles();
  return <pre className={classes.codeBlock}>{JSON.stringify(value || {}, null, 2)}</pre>;
};

const severityClass = (classes: ReturnType<typeof useStyles>, severity?: string) => {
  if (severity === "high") return classes.high;
  if (severity === "medium") return classes.medium;
  if (severity === "low") return classes.low;
  return "";
};

const filterMatches = (filters: FomoV2ReviewCaseFilters, expected: Partial<FomoV2ReviewCaseFilters>) =>
  Object.entries(expected).every(([key, value]) => String(filters[key as keyof FomoV2ReviewCaseFilters] || "") === String(value || ""));

const filterList = (value?: string) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const includesVestingApplyType = (value?: string) =>
  filterList(value).some((type) => VESTING_APPLY_REVIEW_TYPES.includes(type));

const isExplicitVestingFilter = (filters: FomoV2ReviewCaseFilters) =>
  filters.domain === "vesting" || includesVestingApplyType(filters.type);

const normalizeGeneralReviewFilters = (
  filters: FomoV2ReviewCaseFilters
): FomoV2ReviewCaseFilters => ({
  ...filters,
  excludeType: isExplicitVestingFilter(filters) ? "" : GENERAL_REVIEW_EXCLUDED_TYPES,
});

const sourceLabel = (reviewCase: FomoV2ReviewCase) =>
  [reviewCase.source, reviewCase.sourceSlug || reviewCase.sourceId].filter(Boolean).join(":") || "-";

const projectLabel = (project?: FomoV2ProjectSummary, fallbackId?: string) => {
  if (!project) return shortId(fallbackId);
  return [project.name || project.canonicalName || shortId(project.id), project.symbol ? `(${project.symbol})` : ""]
    .filter(Boolean)
    .join(" ");
};

const targetLabel = (reviewCase: FomoV2ReviewCase) => {
  if (reviewCase.suggestedTargetProject) return projectLabel(reviewCase.suggestedTargetProject, reviewCase.suggestedTargetId);
  if (reviewCase.canonicalProject) return projectLabel(reviewCase.canonicalProject, reviewCase.canonicalProjectId);
  if (reviewCase.suggestedTargetCollection || reviewCase.suggestedTargetId) {
    return [reviewCase.suggestedTargetCollection || "suggested target", shortId(reviewCase.suggestedTargetId)].filter(Boolean).join(":");
  }
  if (reviewCase.targetCollection || reviewCase.targetId) {
    return [reviewCase.targetCollection || "target", shortId(reviewCase.targetId)].filter(Boolean).join(":");
  }
  if (reviewCase.canonicalProjectId) return `canonical:${shortId(reviewCase.canonicalProjectId)}`;
  return "manual review";
};

const isVestingApplyCase = (reviewCase: FomoV2ReviewCase) =>
  reviewCase.domain === "vesting" &&
  reviewCase.suggestedAction === "review_and_create_vesting_records" &&
  ["vesting_component_relation_review", "existing_vesting_source"].includes(reviewCase.type);

const isDomainWriteSuggestion = (reviewCase: FomoV2ReviewCase) =>
  reviewCase.type === "category_alias_candidate" ||
  Boolean(reviewCase.suggestedAction || reviewCase.suggestedTargetCollection || reviewCase.suggestedTargetId);

const approveButtonLabel = (reviewCase: FomoV2ReviewCase) => {
  if (isVestingApplyCase(reviewCase)) return "Open in Vesting Review";
  if (isDomainWriteSuggestion(reviewCase)) return "Mark reviewed";
  return "Approve decision";
};

const actionOutcome = (reviewCase: FomoV2ReviewCase) => {
  if (isVestingApplyCase(reviewCase)) {
    return "This vesting replacement should be applied from the dedicated Vesting Review page.";
  }
  if (isDomainWriteSuggestion(reviewCase)) {
    return "Approve only resolves this review case; it does not apply domain changes.";
  }
  if (reviewCase.canonicalProjectId) return "Approve resolves this review case; it does not apply domain changes.";
  return "Approve records reviewer acceptance; it does not apply domain changes.";
};

const compactValue = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) return value.slice(0, 3).map(compactValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value).slice(0, 120);
  const text = String(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const visibleCandidateEntries = (candidate: Record<string, unknown>) =>
  Object.entries(candidate || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .slice(0, 8);

const importCandidatesFor = (reviewCase: FomoV2ReviewCase | null) => {
  const payload = reviewCase?.payload as { importCandidates?: Array<Record<string, unknown>> } | undefined;
  const importCandidates = payload?.importCandidates;
  return Array.isArray(importCandidates) ? importCandidates : [];
};

const FomoV2ReviewCasesPage = () => {
  const classes = useStyles();
  const [data, setData] = useState<FomoV2ReviewCaseListResponse | null>(null);
  const [filters, setFilters] = useState<FomoV2ReviewCaseFilters>(normalizeGeneralReviewFilters({
    status: "open",
    page: 1,
    limit: 50,
  }));
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkNote, setBulkNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<FomoV2ReviewCase | null>(null);
  const [selectedCaseLoading, setSelectedCaseLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [parserModal, setParserModal] = useState<{ reviewCases: FomoV2ReviewCase[]; reason: string; note: string } | null>(null);

  const items = useMemo(() => data?.items || [], [data]);
  const selectedCases = useMemo(
    () => selectedIds.map((id) => items.find((item) => item.id === id)).filter(Boolean) as FomoV2ReviewCase[],
    [items, selectedIds]
  );
  const selectedImportCandidates = useMemo(() => importCandidatesFor(selectedCase), [selectedCase]);
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const showingExplicitVesting = isExplicitVestingFilter(filters);

  const loadCases = async (nextFilters = filters) => {
    setLoading(true);
    const response = await fetchFomoV2ReviewCases(normalizeGeneralReviewFilters(nextFilters));
    setLoading(false);
    if (!response.success) {
      toast.error(response.error || "Failed to load review cases");
      return;
    }
    setData(response.data);
    const nextNotes: Record<string, string> = {};
    response.data.items.forEach((item) => {
      nextNotes[item.id] = item.decisionNote || notes[item.id] || "";
    });
    setNotes((state) => ({ ...nextNotes, ...state }));
  };

  const openReviewCase = async (reviewCase: FomoV2ReviewCase) => {
    setSelectedCase(reviewCase);
    setSelectedCaseLoading(true);
    const response = await fetchFomoV2ReviewCase(reviewCase.id);
    setSelectedCaseLoading(false);
    if (!response.success) {
      toast.error(response.error || "Failed to load review case details");
      return;
    }
    setSelectedCase((current) => (current?.id === reviewCase.id ? response.data : current));
    setNotes((state) => ({
      ...state,
      [response.data.id]: response.data.decisionNote || state[response.data.id] || "",
    }));
  };

  useEffect(() => {
    loadCases();
  }, [
    filters.status,
    filters.domain,
    filters.type,
    filters.severity,
    filters.source,
    filters.search,
    filters.canonicalProjectId,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    const visibleIds = new Set(items.map((item) => item.id));
    setSelectedIds((state) => state.filter((id) => visibleIds.has(id)));
  }, [items]);

  const updateFilter = (key: keyof FomoV2ReviewCaseFilters, value: string | number) => {
    setSelectedIds([]);
    setFilters((state) =>
      normalizeGeneralReviewFilters({
        ...state,
        [key]: value,
        page: key === "page" ? Number(value) : 1,
      })
    );
  };

  const applyQuickFilter = (nextFilters: Partial<FomoV2ReviewCaseFilters>) => {
    setSelectedIds([]);
    setFilters((state) =>
      normalizeGeneralReviewFilters({
        ...state,
        ...nextFilters,
        page: 1,
      })
    );
  };

  const toggleVisibleSelection = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((item) => item.id));
  };

  const toggleCaseSelection = (event: MouseEvent, id: string) => {
    event.stopPropagation();
    setSelectedIds((state) => (state.includes(id) ? state.filter((item) => item !== id) : [...state, id]));
  };

  const runCaseAction = async (
    event: MouseEvent | undefined,
    reviewCase: FomoV2ReviewCase,
    action: string,
    request: () => Promise<{ success: boolean; error?: string }>
  ) => {
    event?.stopPropagation();
    const key = `${reviewCase.id}:${action}`;
    setActionLoading((state) => ({ ...state, [key]: true }));
    const response = await request();
    setActionLoading((state) => ({ ...state, [key]: false }));
    if (!response.success) {
      toast.error(response.error || "Request failed");
      return;
    }
    toast.success("Review case updated");
    if (selectedCase?.id === reviewCase.id) setSelectedCase(null);
    await loadCases();
  };

  const noteFor = (reviewCase: FomoV2ReviewCase) => notes[reviewCase.id] ?? reviewCase.decisionNote ?? "";

  const approveReviewCase = (event: MouseEvent | undefined, reviewCase: FomoV2ReviewCase) => {
    event?.stopPropagation();
    runCaseAction(event, reviewCase, "approve", () =>
      approveFomoV2ReviewCase(reviewCase.id, noteFor(reviewCase))
    );
  };

  const runBulkAction = async (
    action: string,
    request: (reviewCase: FomoV2ReviewCase) => Promise<{ success: boolean; error?: string }>,
    cases = selectedCases
  ) => {
    if (!cases.length) return;
    setBulkLoading(true);
    let failed = 0;
    for (const reviewCase of cases) {
      const response = await request(reviewCase);
      if (!response.success) failed += 1;
    }
    setBulkLoading(false);
    if (failed) toast.error(`${failed} of ${cases.length} ${action} requests failed`);
    else toast.success(`${cases.length} review cases updated`);
    setSelectedIds([]);
    await loadCases();
  };

  const generateCases = async () => {
    setGenerating(true);
    const response = await generateFomoV2ReviewCases(1000);
    setGenerating(false);
    if (!response.success) {
      toast.error(response.error || "Generation failed");
      return;
    }
    const totals = response.data.totals || {};
    toast.success(`Generated ${displayNumber(totals.uniqueCandidates)} review candidates, created ${displayNumber(totals.created)}`);
    await loadCases({ ...filters, page: 1 });
  };

  const sendParserModal = async () => {
    if (!parserModal) return;
    const reason = parserModal.reason.trim() || "admin_review_case";
    if (parserModal.reviewCases.length === 1) {
      await runCaseAction(
        undefined,
        parserModal.reviewCases[0],
        "parser",
        () => sendFomoV2ReviewCaseToParser(parserModal.reviewCases[0].id, reason, parserModal.note)
      );
    } else {
      await runBulkAction(
        "parser",
        (reviewCase) => sendFomoV2ReviewCaseToParser(reviewCase.id, reason, parserModal.note),
        parserModal.reviewCases
      );
    }
    setParserModal(null);
  };

  const copyId = async (value?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success("ID copied");
  };

  const filterByCanonicalProject = (value?: string) => {
    if (!value) return;
    setSelectedCase(null);
    applyQuickFilter({
      status: "",
      severity: "",
      type: "",
      domain: "",
      source: "",
      search: "",
      canonicalProjectId: value,
    });
  };

  const searchById = (value?: string) => {
    if (!value) return;
    setSelectedCase(null);
    applyQuickFilter({
      status: "",
      severity: "",
      type: "",
      domain: "",
      source: "",
      search: value,
      canonicalProjectId: "",
    });
  };

  const countForDomain = (domain: string) => {
    if (!domain) return data?.counts?.all || 0;
    return data?.counts?.byDomain?.[domain] || 0;
  };

  const countByTypes = (types: string[]) =>
    types.reduce((sum, type) => sum + Number(data?.counts?.byType?.[type] || 0), 0);

  const ProjectValue = ({
    label,
    project,
    fallbackId,
    onOpen,
    compact,
  }: {
    label?: string;
    project?: FomoV2ProjectSummary;
    fallbackId?: string;
    onOpen: (value?: string) => void;
    compact?: boolean;
  }) => {
    const id = project?.id || fallbackId;
    const name = project?.name || project?.canonicalName || shortId(id);
    const symbol = project?.symbol;
    const meta = [symbol, project?.slug, project?.status].filter(Boolean).join(" / ");
    const initials = String(name || "?").slice(0, 2).toUpperCase();
    return (
      <div className={label ? classes.detailItem : ""}>
        {label && <span>{label}</span>}
        {id ? (
          <div className={`${classes.projectCard} ${compact ? classes.projectCardCompact : ""}`}>
            <button
              className={classes.projectLogo}
              onClick={(event) => {
                event.stopPropagation();
                onOpen(id);
              }}
            >
              {project?.logoUrl ? <img src={project.logoUrl} alt="" /> : <span>{initials}</span>}
            </button>
            <div className={classes.projectText}>
              <button
                className={classes.projectName}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(id);
                }}
              >
                {name}
              </button>
              <small>{meta || shortId(id)}</small>
            </div>
            {!compact && (
              <button
                className={classes.copyButton}
                onClick={(event) => {
                  event.stopPropagation();
                  copyId(id);
                }}
              >
                Copy
              </button>
            )}
          </div>
        ) : (
          <strong>-</strong>
        )}
      </div>
    );
  };

  const IdValue = ({
    label,
    value,
    onOpen,
  }: {
    label: string;
    value?: string;
    onOpen: (value?: string) => void;
  }) => (
    <div className={classes.detailItem}>
      <span>{label}</span>
      {value ? (
        <div className={classes.idRow}>
          <button className={classes.idLink} onClick={() => onOpen(value)}>
            {shortId(value)}
          </button>
          <button className={classes.copyButton} onClick={() => copyId(value)}>
            Copy
          </button>
        </div>
      ) : (
        <strong>-</strong>
      )}
    </div>
  );

  const IdList = ({
    label,
    values,
    onOpen,
  }: {
    label: string;
    values?: string[];
    onOpen: (value?: string) => void;
  }) => (
    <div className={classes.section}>
      <h3>{label}</h3>
      {values?.length ? (
        <div className={classes.idList}>
          {values.map((value) => (
            <div className={classes.idRow} key={value}>
              <button className={classes.idLink} onClick={() => onOpen(value)}>
                {shortId(value)}
              </button>
              <button className={classes.copyButton} onClick={() => copyId(value)}>
                Copy
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={classes.candidate}>No IDs attached.</div>
      )}
    </div>
  );

  const CandidateSummary = ({ candidate }: { candidate: Record<string, unknown> }) => {
    const entries = visibleCandidateEntries(candidate);
    if (!entries.length) return <div className={classes.candidate}>Empty candidate.</div>;
    return (
      <div className={classes.candidateGrid}>
        {entries.map(([key, value]) => (
          <div className={classes.candidateField} key={key}>
            <span>{pretty(key)}</span>
            <strong>{compactValue(value)}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className={classes.page}>
        <div className={classes.header}>
          <div>
            <h1>FOMO V2 review queue</h1>
            <p>Manual validation queue for skipped, conflicting, missing, and parser-research FOMO V2 cases.</p>
          </div>
          <div className={classes.actions}>
            <button className={classes.button} onClick={() => loadCases()} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button className={`${classes.button} ${classes.primaryButton}`} onClick={generateCases} disabled={generating}>
              {generating ? "Generating..." : "Generate cases"}
            </button>
          </div>
        </div>

        <div className={`${classes.flowNotice} ${showingExplicitVesting ? classes.warningNotice : ""}`}>
          {showingExplicitVesting
            ? "Vesting cases are shown here for inspection only. Apply or replace vesting data from the dedicated flow."
            : "Vesting apply cases are hidden from this general queue by default."}
          <a href={VESTING_REVIEW_PATH}>Vesting Review -&gt;</a>
        </div>

        <div className={classes.summary}>
          <Metric label="Total in filters" value={data?.total} />
          <Metric label="Open" value={data?.counts?.open} />
          <Metric label="High priority" value={data?.counts?.bySeverity?.high} />
          <Metric
            label="Missing canonical"
            value={countByTypes(["missing_canonical_project", "unlock_missing_canonical"])}
          />
          <Metric
            label="Source conflicts"
            value={countByTypes([
              "source_conflict",
              "funding_round_source_conflict",
              "allocation_category_percent_conflict",
              "allocation_row_conflict",
              "vesting_allocation_category_conflict",
            ])}
          />
          <Metric label="Parser stubs" value={data?.counts?.byStatus?.sent_to_parser} />
        </div>

        <div className={classes.quickFilters}>
          {QUICK_FILTERS.map((quickFilter) => (
            <button
              key={quickFilter.key}
              className={`${classes.quickFilter} ${filterMatches(filters, quickFilter.filters) ? classes.quickFilterActive : ""}`}
              onClick={() => applyQuickFilter(quickFilter.filters)}
            >
              {quickFilter.label}
            </button>
          ))}
        </div>

        <div className={classes.tabs}>
          {DOMAINS.map((domain) => (
            <button
              key={domain.label}
              className={`${classes.tab} ${(filters.domain || "") === domain.value ? classes.activeTab : ""}`}
              onClick={() => updateFilter("domain", domain.value)}
            >
              {domain.label} {displayNumber(countForDomain(domain.value))}
            </button>
          ))}
        </div>

        <div className={classes.filters}>
          <select value={filters.status || ""} onChange={(event) => updateFilter("status", event.target.value)}>
            {STATUSES.map((status) => (
              <option key={status || "all"} value={status}>
                {status ? pretty(status) : "Any status"}
              </option>
            ))}
          </select>
          <select value={filters.severity || ""} onChange={(event) => updateFilter("severity", event.target.value)}>
            {SEVERITIES.map((severity) => (
              <option key={severity || "all"} value={severity}>
                {severity ? pretty(severity) : "Any severity"}
              </option>
            ))}
          </select>
          <select value={filters.type || ""} onChange={(event) => updateFilter("type", event.target.value)}>
            {REVIEW_TYPES.map((type) => (
              <option key={type || "all"} value={type}>
                {type ? pretty(type) : "Any type"}
              </option>
            ))}
          </select>
          <select value={filters.source || ""} onChange={(event) => updateFilter("source", event.target.value)}>
            {SOURCES.map((source) => (
              <option key={source || "all"} value={source}>
                {source ? pretty(source) : "Any source"}
              </option>
            ))}
          </select>
          <select value={filters.limit || 50} onChange={(event) => updateFilter("limit", Number(event.target.value))}>
            {[25, 50, 100, 200].map((limit) => (
              <option key={limit} value={limit}>
                {limit} rows
              </option>
            ))}
          </select>
          <input
            value={filters.search || ""}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search title, source, key"
          />
        </div>

        <div className={classes.bulkToolbar}>
          <span>{selectedCases.length ? `${selectedCases.length} selected` : "No cases selected"}</span>
          <div className={classes.actions}>
            <input
              className={classes.bulkNote}
              value={bulkNote}
              onChange={(event) => setBulkNote(event.target.value)}
              placeholder="Bulk note"
            />
            <button
              className={`${classes.button} ${classes.dangerButton}`}
              disabled={!selectedCases.length || bulkLoading}
              onClick={() => runBulkAction("reject", (reviewCase) => rejectFomoV2ReviewCase(reviewCase.id, bulkNote))}
            >
              Bulk reject
            </button>
            <button
              className={classes.button}
              disabled={!selectedCases.length || bulkLoading}
              onClick={() => runBulkAction("ignore", (reviewCase) => ignoreFomoV2ReviewCase(reviewCase.id, bulkNote))}
            >
              Bulk ignore
            </button>
            <button
              className={`${classes.button} ${classes.warningButton}`}
              disabled={!selectedCases.length || bulkLoading}
              onClick={() =>
                setParserModal({
                  reviewCases: selectedCases,
                  reason: "bulk_admin_review_case",
                  note: bulkNote,
                })
              }
            >
              Bulk parser
            </button>
          </div>
        </div>

        {!loading && !items.length ? (
          <div className={classes.empty}>No review cases found for the current filters.</div>
        ) : (
          <div className={classes.caseList}>
            <div className={classes.selectAllCard}>
              <label>
                <input
                  className={classes.checkbox}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisibleSelection}
                  onClick={(event) => event.stopPropagation()}
                />
                <span>{allVisibleSelected ? "Unselect visible cases" : "Select visible cases"}</span>
              </label>
            </div>
            {items.map((reviewCase) => (
              <div
                className={`${classes.caseCard} ${selectedIds.includes(reviewCase.id) ? classes.caseCardSelected : ""}`}
                key={reviewCase.id}
                onClick={() => openReviewCase(reviewCase)}
              >
                <div className={classes.caseHeader}>
                  <div className={classes.caseTitle}>
                    <input
                      className={classes.checkbox}
                      type="checkbox"
                      checked={selectedIds.includes(reviewCase.id)}
                      onClick={(event) => toggleCaseSelection(event, reviewCase.id)}
                      onChange={() => undefined}
                    />
                    <div>
                      <h2>{reviewCase.title}</h2>
                      <p>{reviewCase.description || reviewCase.caseKey}</p>
                    </div>
                  </div>
                  <div className={classes.caseBadges}>
                      <span className={`${classes.pill} ${reviewCase.status === "open" ? classes.statusOpen : ""}`}>
                        {pretty(reviewCase.status)}
                      </span>
                      <span className={`${classes.pill} ${severityClass(classes, reviewCase.severity)}`}>{pretty(reviewCase.severity)}</span>
                      <span className={classes.pill}>{pretty(reviewCase.domain)}</span>
                      <span className={classes.pill}>{pretty(reviewCase.type)}</span>
                      {reviewCase.confidence && <span className={classes.pill}>{reviewCase.confidence}</span>}
                    </div>
                  </div>

                <div className={classes.caseBody}>
                  <div className={classes.relationBox}>
                    <span>Source to review</span>
                    <strong>{sourceLabel(reviewCase)} -&gt; {targetLabel(reviewCase)}</strong>
                    <small>{actionOutcome(reviewCase)}</small>
                  </div>
                  <div className={classes.caseMeta}>
                    <div>
                      <span>Created</span>
                      <strong>{formatDate(reviewCase.createdAt)}</strong>
                    </div>
                    <div>
                      <span>Canonical</span>
                      <ProjectValue
                        project={reviewCase.canonicalProject}
                        fallbackId={reviewCase.canonicalProjectId}
                        onOpen={filterByCanonicalProject}
                        compact
                      />
                    </div>
                    <div>
                      <span>Target</span>
                      {reviewCase.suggestedTargetProject ? (
                        <ProjectValue
                          project={reviewCase.suggestedTargetProject}
                          fallbackId={reviewCase.suggestedTargetId}
                          onOpen={filterByCanonicalProject}
                          compact
                        />
                      ) : (
                        <strong>{reviewCase.targetCollection || reviewCase.suggestedTargetCollection || "-"}</strong>
                      )}
                    </div>
                  </div>
                </div>

                <div className={classes.cardActions}>
                  {isVestingApplyCase(reviewCase) ? (
                    <a
                      className={`${classes.tinyButton} ${classes.primaryTinyButton}`}
                      href={VESTING_REVIEW_PATH}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Open in Vesting Review
                    </a>
                  ) : (
                    <button
                      className={`${classes.tinyButton} ${classes.primaryTinyButton}`}
                      onClick={(event) => approveReviewCase(event, reviewCase)}
                      disabled={actionLoading[`${reviewCase.id}:approve`]}
                    >
                      {approveButtonLabel(reviewCase)}
                    </button>
                  )}
                  <button
                    className={classes.tinyButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      setParserModal({
                        reviewCases: [reviewCase],
                        reason: reviewCase.suggestedAction === "parser_research" ? "suggested_parser_research" : "admin_review_case",
                        note: noteFor(reviewCase),
                      });
                    }}
                  >
                    Send to parser
                  </button>
                  <button
                    className={classes.tinyButton}
                    onClick={(event) =>
                      runCaseAction(event, reviewCase, "reject", () => rejectFomoV2ReviewCase(reviewCase.id, noteFor(reviewCase)))
                    }
                    disabled={actionLoading[`${reviewCase.id}:reject`]}
                  >
                    Reject
                  </button>
                  <button
                    className={classes.tinyButton}
                    onClick={(event) =>
                      runCaseAction(event, reviewCase, "ignore", () => ignoreFomoV2ReviewCase(reviewCase.id, noteFor(reviewCase)))
                    }
                    disabled={actionLoading[`${reviewCase.id}:ignore`]}
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={classes.pagination}>
          <span>
            Page {data?.page || 1} of {data?.pages || 1}, {displayNumber(data?.total)} cases
          </span>
          <div className={classes.actions}>
            <button
              className={classes.button}
              disabled={(filters.page || 1) <= 1}
              onClick={() => updateFilter("page", Math.max(1, Number(filters.page || 1) - 1))}
            >
              Previous
            </button>
            <button
              className={classes.button}
              disabled={(filters.page || 1) >= (data?.pages || 1)}
              onClick={() => updateFilter("page", Number(filters.page || 1) + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedCase && (
        <>
          <div className={classes.drawerBackdrop} onClick={() => setSelectedCase(null)} />
          <div className={classes.drawer}>
            <div className={classes.drawerHead}>
              <div>
                <h2>{selectedCase.title}</h2>
                <div className={classes.actions}>
                  <span className={`${classes.pill} ${selectedCase.status === "open" ? classes.statusOpen : ""}`}>
                    {pretty(selectedCase.status)}
                  </span>
                  <span className={`${classes.pill} ${severityClass(classes, selectedCase.severity)}`}>{pretty(selectedCase.severity)}</span>
                  <span className={classes.pill}>{pretty(selectedCase.domain)}</span>
                </div>
              </div>
              <button className={classes.closeButton} onClick={() => setSelectedCase(null)}>
                X
              </button>
            </div>

            {selectedCaseLoading && <div className={classes.loadingNotice}>Loading full review data...</div>}

            <div className={classes.detailGrid}>
              <div className={classes.detailItem}>
                <span>Type</span>
                <strong>{pretty(selectedCase.type)}</strong>
              </div>
              <div className={classes.detailItem}>
                <span>Source</span>
                <strong>{selectedCase.source}</strong>
              </div>
              <div className={classes.detailItem}>
                <span>Source identity</span>
                <strong>{selectedCase.sourceSlug || selectedCase.sourceId || "-"}</strong>
              </div>
              <ProjectValue
                label="Canonical project"
                project={selectedCase.canonicalProject}
                fallbackId={selectedCase.canonicalProjectId}
                onOpen={filterByCanonicalProject}
              />
              <ProjectValue
                label="Suggested target"
                project={selectedCase.suggestedTargetProject}
                fallbackId={selectedCase.suggestedTargetId}
                onOpen={filterByCanonicalProject}
              />
              <IdValue label="Source entity" value={selectedCase.sourceEntityId} onOpen={searchById} />
              <div className={classes.detailItem}>
                <span>Target collection</span>
                <strong>{selectedCase.targetCollection || "-"}</strong>
              </div>
              <IdValue label="Target ID" value={selectedCase.targetId} onOpen={searchById} />
              <div className={classes.detailItem}>
                <span>Suggested action</span>
                <strong>
                  {pretty(selectedCase.suggestedAction)} {shortId(selectedCase.suggestedTargetId)}
                </strong>
              </div>
            </div>

            <div className={classes.relationBox}>
              <span>Source to target</span>
              <strong>{sourceLabel(selectedCase)} -&gt; {targetLabel(selectedCase)}</strong>
              <small>{actionOutcome(selectedCase)}</small>
            </div>

            {selectedCase.description && (
              <div className={classes.section}>
                <h3>Description</h3>
                <div className={classes.candidate}>{selectedCase.description}</div>
              </div>
            )}

            <div className={classes.section}>
              <h3>Decision note</h3>
              <textarea
                className={classes.noteBox}
                value={noteFor(selectedCase)}
                onChange={(event) =>
                  setNotes((state) => ({
                    ...state,
                    [selectedCase.id]: event.target.value,
                  }))
                }
              />
              <div className={classes.actions} style={{ marginTop: 10 }}>
                {isVestingApplyCase(selectedCase) ? (
                  <a
                    className={`${classes.button} ${classes.primaryButton} ${classes.buttonLink}`}
                    href={VESTING_REVIEW_PATH}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Open in Vesting Review
                  </a>
                ) : (
                  <button
                    className={`${classes.button} ${classes.primaryButton}`}
                    onClick={(event) => approveReviewCase(event, selectedCase)}
                  >
                    {approveButtonLabel(selectedCase)}
                  </button>
                )}
                <button
                  className={`${classes.button} ${classes.dangerButton}`}
                  onClick={(event) =>
                    runCaseAction(event, selectedCase, "reject", () => rejectFomoV2ReviewCase(selectedCase.id, noteFor(selectedCase)))
                  }
                >
                  Reject
                </button>
                <button
                  className={`${classes.button} ${classes.warningButton}`}
                  onClick={() =>
                    setParserModal({
                      reviewCases: [selectedCase],
                      reason: selectedCase.suggestedAction === "parser_research" ? "suggested_parser_research" : "admin_review_case",
                      note: noteFor(selectedCase),
                    })
                  }
                >
                  Send to parser research
                </button>
                <button
                  className={classes.button}
                  onClick={(event) =>
                    runCaseAction(event, selectedCase, "ignore", () => ignoreFomoV2ReviewCase(selectedCase.id, noteFor(selectedCase)))
                  }
                >
                  Ignore
                </button>
              </div>
            </div>

            <div className={classes.section}>
              <h3>Candidates</h3>
              {selectedCase.candidates?.length ? (
                selectedCase.candidates.map((candidate, index) => (
                  <div className={classes.candidate} key={index}>
                    <CandidateSummary candidate={candidate} />
                    <details className={classes.detailsBox}>
                      <summary>Raw candidate JSON</summary>
                      <JsonBlock value={candidate} />
                    </details>
                  </div>
                ))
              ) : (
                <div className={classes.candidate}>No candidates attached.</div>
              )}
            </div>

            <div className={classes.section}>
              <h3>Import candidates</h3>
              {selectedImportCandidates.length ? (
                selectedImportCandidates.map((candidate, index) => (
                  <div className={classes.candidate} key={String(candidate.id || candidate.candidateFingerprint || index)}>
                    <CandidateSummary candidate={candidate} />
                    <details className={classes.detailsBox}>
                      <summary>Raw import candidate JSON</summary>
                      <JsonBlock value={candidate} />
                    </details>
                  </div>
                ))
              ) : (
                <div className={classes.candidate}>
                  {selectedCaseLoading ? "Loading raw import candidates..." : "No import candidates linked."}
                </div>
              )}
            </div>

            <IdList label="Evidence IDs" values={selectedCase.evidenceIds} onOpen={searchById} />
            <IdList label="Conflict IDs" values={selectedCase.conflictIds} onOpen={searchById} />

            <div className={classes.section}>
              <details className={classes.detailsBox}>
                <summary>Payload JSON</summary>
                <JsonBlock value={selectedCase.payload} />
              </details>
            </div>

            <div className={classes.section}>
              <h3>Decision history</h3>
              {selectedCase.decisionHistory?.length ? (
                selectedCase.decisionHistory.map((history, index) => (
                  <div className={classes.candidate} key={index}>
                    <CandidateSummary candidate={history} />
                    <details className={classes.detailsBox}>
                      <summary>Raw decision JSON</summary>
                      <JsonBlock value={history} />
                    </details>
                  </div>
                ))
              ) : (
                <div className={classes.candidate}>No decisions recorded.</div>
              )}
            </div>
          </div>
        </>
      )}

      {parserModal && (
        <>
          <div className={classes.drawerBackdrop} onClick={() => setParserModal(null)} />
          <div className={classes.modal}>
            <h2>Send {parserModal.reviewCases.length} to parser research</h2>
            <div className={classes.section}>
              <h3>Reason</h3>
              <textarea
                className={classes.noteBox}
                value={parserModal.reason}
                onChange={(event) => setParserModal({ ...parserModal, reason: event.target.value })}
              />
            </div>
            <div className={classes.section}>
              <h3>Note</h3>
              <textarea
                className={classes.noteBox}
                value={parserModal.note}
                onChange={(event) => setParserModal({ ...parserModal, note: event.target.value })}
              />
            </div>
            <div className={classes.actions} style={{ marginTop: 14 }}>
              <button className={`${classes.button} ${classes.warningButton}`} onClick={sendParserModal}>
                Send
              </button>
              <button className={classes.button} onClick={() => setParserModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default FomoV2ReviewCasesPage;
