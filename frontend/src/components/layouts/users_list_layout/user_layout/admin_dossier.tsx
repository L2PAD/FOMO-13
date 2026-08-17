import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import fetchUserAdminDossier, {
  UserAdminDossierSection,
} from "../../../services/user/fetchUserAdminDossier";
import { useAdminDossierStyles } from "./admin_dossier_styles";

type DossierRecord = Record<string, unknown>;
type SectionKey = Exclude<UserAdminDossierSection, "summary">;

interface UserAdminDossierProps {
  userId: string;
}

interface SectionState {
  items: DossierRecord[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  error: string;
}

interface Field {
  label: string;
  value: React.ReactNode;
}

const PAGE_LIMIT = 10;

const SECTION_TABS: Array<{ key: SectionKey; label: string }> = [
  { key: "portfolios", label: "Portfolio" },
  { key: "otc", label: "OTC" },
  { key: "p2p", label: "P2P" },
  { key: "withdraws", label: "Withdraws" },
  { key: "deposits", label: "Deposits" },
  { key: "comments", label: "Comments" },
  { key: "support", label: "Support" },
  { key: "appeals", label: "Appeals" },
  { key: "logs", label: "Logs" },
];

const WITHDRAW_STATUS_MAP: Record<string, string> = {
  "0": "PENDING",
  "1": "COMPLETED",
  "2": "REJECTED",
  "3": "CANCELED",
  "4": "DELETED",
  "5": "APPROVED",
};

const buildInitialSections = (): Record<SectionKey, SectionState> =>
  SECTION_TABS.reduce((acc, tab) => {
    acc[tab.key] = {
      items: [],
      total: 0,
      hasMore: false,
      isLoading: false,
      isLoaded: false,
      error: "",
    };
    return acc;
  }, {} as Record<SectionKey, SectionState>);

const isRecord = (value: unknown): value is DossierRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getValue = (record: DossierRecord, path: string[]): unknown =>
  path.reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, record);

const getArray = (record: DossierRecord, key: string): DossierRecord[] => {
  const value = record[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
};

const formatText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const formatStatus = (value: unknown): string => {
  const raw = formatText(value);
  return WITHDRAW_STATUS_MAP[raw] || raw;
};

const formatDate = (value: unknown): string => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatNumber = (value: unknown, maximumFractionDigits = 2): string => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return numberValue.toLocaleString("en-US", { maximumFractionDigits });
};

const formatMoney = (value: unknown): string => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `$${numberValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
};

const compactId = (value: unknown): string => {
  const text = formatText(value);
  if (text === "-" || text.length <= 12) return text;
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const formatUser = (value: unknown): string => {
  if (!isRecord(value)) return "-";
  return formatText(
    value.username ||
      getValue(value, ["twitterData", "username"]) ||
      value.email ||
      value.wallet ||
      value._id
  );
};

const truncate = (value: unknown, maxLength = 180): string => {
  const text = formatText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
};

const getSectionTitle = (key: SectionKey): string =>
  SECTION_TABS.find((tab) => tab.key === key)?.label || key;

type LogTone = "default" | "error" | "success" | "warning";

const getLogTone = (item: DossierRecord): LogTone => {
  const source = [
    item.severity,
    item.status,
    item.action,
    item.title,
    item.description,
  ]
    .map(formatText)
    .join(" ")
    .toLowerCase();

  if (
    ["error", "fail", "failed", "rejected", "reject", "declined", "blocked"].some(
      (marker) => source.includes(marker)
    )
  ) {
    return "error";
  }

  if (["warning", "warn", "pending", "risk"].some((marker) => source.includes(marker))) {
    return "warning";
  }

  if (
    [
      "success",
      "succeeded",
      "completed",
      "complete",
      "confirmed",
      "approved",
      "connected",
      "created",
      "updated",
      "saved",
      "resolved",
    ].some((marker) => source.includes(marker))
  ) {
    return "success";
  }

  return "default";
};

const UserAdminDossier: React.FC<UserAdminDossierProps> = ({ userId }) => {
  const styles = useAdminDossierStyles();
  const [summary, setSummary] = useState<DossierRecord | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>("portfolios");
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(
    buildInitialSections
  );
  const summaryRequestIdRef = useRef(0);

  useEffect(() => {
    summaryRequestIdRef.current += 1;
    setSummary(null);
    setSummaryError("");
    setSections(buildInitialSections());
    setActiveSection("portfolios");
  }, [userId]);

  const loadSummary = useCallback(async () => {
    if (!userId) return;

    const requestId = summaryRequestIdRef.current + 1;
    summaryRequestIdRef.current = requestId;
    setIsSummaryLoading(true);

    try {
      const response = await fetchUserAdminDossier(userId, { section: "summary" });

      if (summaryRequestIdRef.current !== requestId) return;

      if (response.success && isRecord(response.data)) {
        setSummary(response.data);
        setSummaryError("");
      } else {
        setSummaryError(formatText(response.data) || "Failed to load summary");
      }
    } catch (error) {
      if (summaryRequestIdRef.current === requestId) {
        setSummaryError(error instanceof Error ? error.message : "Failed to load summary");
      }
    } finally {
      if (summaryRequestIdRef.current === requestId) {
        setIsSummaryLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void loadSummary();
    }
  }, [loadSummary, userId]);

  const loadSection = useCallback(
    async (section: SectionKey, offset = 0) => {
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          isLoading: true,
          error: "",
        },
      }));

      const response = await fetchUserAdminDossier(userId, {
        section,
        offset,
        limit: PAGE_LIMIT,
      });

      setSections((prev) => {
        if (!response.success || !isRecord(response.data)) {
          return {
            ...prev,
            [section]: {
              ...prev[section],
              isLoading: false,
              isLoaded: true,
              error: formatText(response.data) || "Failed to load data",
            },
          };
        }

        const responseItems = Array.isArray(response.data.items)
          ? response.data.items.filter(isRecord)
          : [];

        const nextItems = offset === 0
          ? responseItems
          : [...prev[section].items, ...responseItems];

        return {
          ...prev,
          [section]: {
            items: nextItems,
            total: Number(response.data.total || 0),
            hasMore: Boolean(response.data.hasMore),
            isLoading: false,
            isLoaded: true,
            error: "",
          },
        };
      });
    },
    [userId]
  );

  useEffect(() => {
    if (!sections[activeSection].isLoaded && !sections[activeSection].isLoading) {
      loadSection(activeSection, 0);
    }
  }, [activeSection, loadSection, sections]);

  const summaryCards = useMemo(() => {
    const summaryRecord = summary ?? {};
    const portfolios = isRecord(summaryRecord.portfolios) ? summaryRecord.portfolios : {};
    const deals = isRecord(summaryRecord.deals) ? summaryRecord.deals : {};
    const withdraws = isRecord(summaryRecord.withdraws) ? summaryRecord.withdraws : {};
    const deposits = isRecord(summaryRecord.deposits) ? summaryRecord.deposits : {};
    const community = isRecord(summaryRecord.community) ? summaryRecord.community : {};

    return [
      {
        title: "Portfolio",
        value: formatMoney(portfolios.totalBalance),
        meta: `${formatNumber(portfolios.total)} portfolios / ${formatNumber(portfolios.assetsTotal)} assets`,
      },
      {
        title: "OTC / P2P",
        value: formatNumber(deals.total),
        meta: `${formatNumber(deals.otc)} OTC / ${formatNumber(deals.p2p)} P2P`,
      },
      {
        title: "Finance",
        value: formatMoney(deposits.totalAmount),
        meta: `${formatNumber(deposits.total)} deposits / ${formatNumber(withdraws.total)} withdraws`,
      },
      {
        title: "Community",
        value: formatNumber(community.commentsTotal),
        meta: `${formatNumber(community.supportTotal)} support / ${formatNumber(community.appealsTotal)} appeals / ${formatNumber(community.logsTotal)} logs`,
      },
    ];
  }, [summary]);

  const renderFields = (fields: Field[]) => (
    <div className={styles.fieldsGrid}>
      {fields.map((field) => (
        <div className={styles.field} key={field.label}>
          <span className={styles.fieldLabel}>{field.label}</span>
          <span className={styles.fieldValue}>{field.value}</span>
        </div>
      ))}
    </div>
  );

  const renderPortfolio = (item: DossierRecord) => {
    const topAssets = getArray(item, "topAssets");

    return (
      <div className={styles.row} key={formatText(item._id)}>
        <div className={styles.rowTop}>
          <p className={styles.rowTitle}>{formatText(item.name)}</p>
          <span className={styles.badge}>{formatText(item.shareType || "private")}</span>
        </div>
        {renderFields([
          { label: "Balance", value: formatMoney(item.totalBalance) },
          { label: "Invested", value: formatMoney(item.totalInvested) },
          { label: "Profit", value: formatMoney(item.profit) },
          { label: "ROI", value: `${formatNumber(item.profitPercent)}%` },
          { label: "Assets", value: formatNumber(item.assetCount, 0) },
          { label: "Battle", value: formatText(item.isBattle) },
          { label: "Shared", value: formatText(item.isShare) },
          { label: "Updated", value: formatDate(item.updatedAt) },
        ])}
        {topAssets.length ? (
          <p className={styles.textBlock}>
            {topAssets
              .map((asset) =>
                `${formatText(asset.currency)} ${formatMoney(asset.currentValue)} (${formatNumber(asset.profitPercent)}%)`
              )
              .join(" / ")}
          </p>
        ) : null}
      </div>
    );
  };

  const renderDeal = (item: DossierRecord) => (
    <div className={styles.row} key={formatText(item._id)}>
      <div className={styles.rowTop}>
        <p className={styles.rowTitle}>{formatText(item.name || item._id)}</p>
        <span className={styles.badge}>{formatStatus(item.status)}</span>
      </div>
      {renderFields([
        { label: "Role", value: formatText(item.userRole) },
        { label: "Type", value: formatText(item.type) },
        { label: "Section", value: formatText(item.section) },
        { label: "Service", value: formatText(item.serviceType) },
        { label: "Amount", value: formatNumber(item.amount) },
        { label: "Price", value: `${formatNumber(item.price)} ${formatText(item.ticker || item.currency)}` },
        { label: "Created", value: formatDate(item.createDate) },
        { label: "Updated", value: formatDate(item.lastStatusUpdate) },
        { label: "Creator", value: formatUser(item.creator) },
        { label: "Buyer", value: formatUser(item.buyer) },
        { label: "Seller", value: formatUser(item.seller) },
        { label: "Appeal", value: formatText(item.isAppeal) },
      ])}
    </div>
  );

  const renderWithdraw = (item: DossierRecord) => (
    <div className={styles.row} key={formatText(item._id)}>
      <div className={styles.rowTop}>
        <p className={styles.rowTitle}>{compactId(item.transactionHash || item._id)}</p>
        <span className={styles.badge}>{formatStatus(item.status)}</span>
      </div>
      {renderFields([
        { label: "Amount", value: `${formatNumber(item.amount)} ${formatText(item.currency)}` },
        { label: "Fee", value: formatNumber(item.fee) },
        { label: "Total send", value: formatNumber(item.totalSend) },
        { label: "Network", value: formatText(item.network) },
        { label: "Wallet", value: compactId(item.userWallet) },
        { label: "Type", value: formatText(item.type) },
        { label: "Created", value: formatDate(item.createdAt) },
        { label: "Confirmed", value: formatDate(item.confirmationDate) },
      ])}
      {item.reason ? <p className={styles.textBlock}>{truncate(item.reason)}</p> : null}
    </div>
  );

  const renderDeposit = (item: DossierRecord) => (
    <div className={styles.row} key={formatText(item._id)}>
      <div className={styles.rowTop}>
        <p className={styles.rowTitle}>{compactId(item.transactionHash || item._id)}</p>
        <span className={styles.badge}>{formatStatus(item.status)}</span>
      </div>
      {renderFields([
        { label: "Amount", value: `${formatNumber(item.amount)} ${formatText(item.currency)}` },
        { label: "Net amount", value: formatNumber(item.netAmount) },
        { label: "Service fee", value: formatNumber(item.serviceFee) },
        { label: "Gas fee", value: formatNumber(item.gasFee) },
        { label: "Network", value: formatText(item.network) },
        { label: "Wallet", value: compactId(item.walletAddress) },
        { label: "Confirmations", value: formatNumber(item.confirmations, 0) },
        { label: "Created", value: formatDate(item.createdAt) },
      ])}
    </div>
  );

  const renderComment = (item: DossierRecord) => (
    <div className={styles.row} key={formatText(item._id)}>
      <div className={styles.rowTop}>
        <p className={styles.rowTitle}>{formatText(item.topicName || item.page || "Comment")}</p>
        <span className={styles.badge}>{item.isTopic ? "Topic" : "Comment"}</span>
      </div>
      {renderFields([
        { label: "Page", value: formatText(item.page) },
        { label: "Path", value: formatText(item.path) },
        { label: "Likes", value: formatNumber(item.likesCount, 0) },
        { label: "Dislikes", value: formatNumber(item.dislikesCount, 0) },
        { label: "Reports", value: formatNumber(item.reportsCount, 0) },
        { label: "Answers", value: formatNumber(item.answersCount, 0) },
        { label: "Views", value: formatNumber(item.viewsCount, 0) },
        { label: "Date", value: formatDate(item.date) },
      ])}
      <p className={styles.textBlock}>{truncate(item.text, 260)}</p>
    </div>
  );

  const renderSupport = (item: DossierRecord) => (
    <div className={styles.row} key={formatText(item._id)}>
      <div className={styles.rowTop}>
        <p className={styles.rowTitle}>{formatText(item.theme)}</p>
        <span className={styles.badge}>{formatText(item.category)}</span>
      </div>
      {renderFields([
        { label: "Project", value: formatText(getValue(item, ["project", "name"])) },
        { label: "File", value: compactId(item.file) },
        { label: "Date", value: formatDate(item.date) },
      ])}
      <p className={styles.textBlock}>{truncate(item.message, 260)}</p>
    </div>
  );

  const renderAppeal = (item: DossierRecord) => (
    <div className={styles.row} key={formatText(item._id)}>
      <div className={styles.rowTop}>
        <p className={styles.rowTitle}>{formatText(item.appealId || item._id)}</p>
        <span className={styles.badge}>{formatStatus(item.status)}</span>
      </div>
      {renderFields([
        { label: "Role", value: formatText(item.role) },
        { label: "Deal", value: formatText(getValue(item, ["deal", "name"]) || compactId(getValue(item, ["deal", "_id"]))) },
        { label: "Deal status", value: formatStatus(getValue(item, ["deal", "status"])) },
        { label: "Section", value: formatText(getValue(item, ["deal", "section"])) },
        { label: "Price", value: `${formatNumber(getValue(item, ["deal", "price"]))} ${formatText(getValue(item, ["deal", "ticker"]) || getValue(item, ["deal", "currency"]))}` },
        { label: "Chat", value: compactId(item.supportChatId) },
        { label: "Created", value: formatDate(item.createdAt) },
        { label: "Resolved", value: formatDate(item.resolvedAt) },
      ])}
      <p className={styles.textBlock}>
        {truncate(item.reason || item.description || item.resolution, 260)}
      </p>
    </div>
  );

  const renderLog = (item: DossierRecord) => {
    const metadata = isRecord(item.metadata) ? item.metadata : {};
    const metadataText = Object.keys(metadata).length
      ? JSON.stringify(metadata)
      : item.description;
    const tone = getLogTone(item);
    const toneClass = {
      default: "",
      error: styles.terminalError,
      success: styles.terminalSuccess,
      warning: styles.terminalWarning,
    }[tone];

    return (
      <div className={`${styles.terminalRow} ${toneClass}`} key={formatText(item._id)}>
        <div className={styles.terminalCommandLine}>
          <span className={styles.terminalPrompt}>PS admin&gt;</span>
          <span className={styles.terminalCommand}>{formatText(item.action)}</span>
          <span className={styles.terminalStatus}>{formatText(item.severity)}</span>
        </div>

        <p className={styles.terminalTitle}>{formatText(item.title || item.action)}</p>

        <div className={styles.terminalMetaGrid}>
          <span>time={formatDate(item.createdAt)}</span>
          <span>category={formatText(item.category)}</span>
          <span>
            actor={formatText(item.actorType)}:{compactId(item.actorId)}
          </span>
          <span>
            entity={formatText(item.entityType)}:{compactId(item.entityId)}
          </span>
        </div>

        {metadataText ? (
          <pre className={styles.terminalPayload}>{truncate(metadataText, 420)}</pre>
        ) : null}
      </div>
    );
  };

  const renderSectionItem = (section: SectionKey, item: DossierRecord) => {
    switch (section) {
      case "portfolios":
        return renderPortfolio(item);
      case "otc":
      case "p2p":
        return renderDeal(item);
      case "withdraws":
        return renderWithdraw(item);
      case "deposits":
        return renderDeposit(item);
      case "comments":
        return renderComment(item);
      case "support":
        return renderSupport(item);
      case "appeals":
        return renderAppeal(item);
      case "logs":
        return renderLog(item);
      default:
        return null;
    }
  };

  const activeState = sections[activeSection];
  const isRefreshing = activeState.isLoading || isSummaryLoading;
  const handleRefreshActiveData = () => {
    void loadSection(activeSection, 0);
    void loadSummary();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <div className={styles.summaryCard} key={card.title}>
            <p className={styles.summaryTitle}>{card.title}</p>
            <p className={styles.summaryValue}>
              {isSummaryLoading && !summary ? "Loading..." : card.value}
            </p>
            <div className={styles.summaryMeta}>{card.meta}</div>
          </div>
        ))}
      </div>

      {summaryError ? <div className={styles.error}>{summaryError}</div> : null}

      <div className={styles.dossierCard}>
        <div className={styles.tabsBar}>
          <div className={styles.tabs} role="tablist" aria-label="User dossier sections">
            {SECTION_TABS.map((tab) => {
              const tabState = sections[tab.key];

              return (
                <button
                  aria-selected={activeSection === tab.key}
                  className={`${styles.tabButton} ${activeSection === tab.key ? "active" : ""}`}
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  role="tab"
                  type="button"
                >
                  <span className={styles.tabLabel}>{tab.label}</span>
                  <span className={styles.tabCount}>
                    {tabState.isLoaded ? formatNumber(tabState.total, 0) : "-"}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            className={styles.refreshButton}
            disabled={isRefreshing}
            onClick={handleRefreshActiveData}
            title="Refresh active tab"
            type="button"
          >
            <span aria-hidden="true" className={styles.refreshIcon}>
              ↻
            </span>
            Refresh
          </button>
        </div>

        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>{getSectionTitle(activeSection)}</p>
          <span className={styles.sectionCounter}>
            {formatNumber(activeState.items.length, 0)} / {formatNumber(activeState.total, 0)}
          </span>
        </div>

        {activeState.error ? <div className={styles.error}>{activeState.error}</div> : null}

        <div className={activeSection === "logs" ? styles.terminalRows : styles.rows}>
          {activeState.items.map((item) => renderSectionItem(activeSection, item))}
        </div>

        {!activeState.isLoading && activeState.isLoaded && activeState.items.length === 0 ? (
          <div className={styles.empty}>No data</div>
        ) : null}

        {activeState.isLoading ? <div className={styles.empty}>Loading...</div> : null}

        {activeState.hasMore ? (
          <div className={styles.footer}>
            <button
              className={styles.loadMoreButton}
              disabled={activeState.isLoading}
              onClick={() => loadSection(activeSection, activeState.items.length)}
              type="button"
            >
              Load more
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserAdminDossier;
