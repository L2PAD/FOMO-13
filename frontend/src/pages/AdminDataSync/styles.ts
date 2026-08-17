import { createUseStyles } from "react-jss";

export const useStyles = createUseStyles({
  page: {
    minHeight: "calc(100vh - 74px)",
    background: "var(--color-surface-muted)",
    color: "var(--color-text-primary)",
    padding: "20px 24px 24px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,

    "& h1": {
      margin: 0,
      fontSize: 24,
      lineHeight: "30px",
    },

    "& p": {
      margin: "5px 0 0",
      color: "var(--color-text-muted)",
      fontSize: 13,
      lineHeight: "18px",
    },

    "@media (max-width: 760px)": {
      flexDirection: "column",
    },
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
  },
  badge: {
    minHeight: 28,
    border: "1px solid #DDE6F0",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
    padding: "5px 9px",
    boxSizing: "border-box",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-semibold)",
    whiteSpace: "nowrap",
  },
  warningBadge: {
    borderColor: "rgba(210, 127, 43, 0.32)",
    background: "rgba(210, 127, 43, 0.1)",
    color: "#9A5B12",
  },
  successBadge: {
    borderColor: "rgba(40, 157, 99, 0.32)",
    background: "rgba(40, 157, 99, 0.1)",
    color: "#19764A",
  },
  dangerBadge: {
    borderColor: "rgba(186, 47, 47, 0.28)",
    background: "rgba(186, 47, 47, 0.09)",
    color: "#9F2525",
  },
  neutralBadge: {
    borderColor: "#DDE6F0",
    background: "#F8FAFC",
    color: "#475569",
  },
  inlineBadge: {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 8,
    verticalAlign: "middle",
  },
  inlineBadgeReset: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 24,
    padding: "4px 8px",
  },
  statusRail: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 14,

    "@media (max-width: 1180px)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },

    "@media (max-width: 760px)": {
      gridTemplateColumns: "1fr",
    },
  },
  statusItem: {
    minWidth: 0,
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: "11px 12px",
    boxSizing: "border-box",

    "& span": {
      display: "block",
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "15px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
    },

    "& strong": {
      display: "block",
      marginTop: 4,
      fontSize: 13,
      lineHeight: "18px",
      overflowWrap: "anywhere",
    },
  },
  managerTabs: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    border: "1px solid #DDE6F0",
    borderRadius: 8,
    background: "#F8FAFC",
    padding: 6,
    marginBottom: 16,
  },
  managerTab: {
    minHeight: 48,
    border: "1px solid transparent",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-text-secondary)",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: "var(--font-weight-semibold)",
    cursor: "pointer",
  },
  managerTabActive: {
    borderColor: "#C8D5E3",
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
  },
  managerIntro: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: "14px 16px",
    marginBottom: 16,

    "& h2": {
      margin: 0,
      fontSize: 20,
      lineHeight: "26px",
    },

    "& p": {
      margin: "5px 0 0",
      color: "var(--color-text-muted)",
      fontSize: 13,
      lineHeight: "18px",
    },

    "@media (max-width: 760px)": {
      flexDirection: "column",
    },
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
    gap: 16,

    "@media (max-width: 1100px)": {
      gridTemplateColumns: "1fr",
    },
  },
  panel: {
    minWidth: 0,
    background: "var(--color-white)",
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #EEF2F6",

    "& h2": {
      margin: 0,
      fontSize: 18,
      lineHeight: "24px",
    },

    "& p": {
      margin: "5px 0 0",
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "17px",
    },
  },
  panelBody: {
    padding: 16,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  button: {
    minHeight: 38,
    border: "none",
    borderRadius: 8,
    background: "var(--color-text-primary)",
    color: "var(--color-white)",
    padding: "9px 13px",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: "var(--font-weight-semibold)",
    cursor: "pointer",

    "&:disabled": {
      opacity: 0.52,
      cursor: "not-allowed",
    },
  },
  secondaryButton: {
    background: "var(--color-primary)",
  },
  dangerButton: {
    background: "#BA2F2F",
  },
  ghostButton: {
    border: "1px solid #DDE6F0",
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
  },
  mutedText: {
    color: "var(--color-text-muted)",
    fontSize: 12,
    lineHeight: "17px",
  },
  subheading: {
    margin: "0 0 10px",
    fontSize: 14,
    lineHeight: "20px",
  },
  activePromotion: {
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    background: "#FAFCFE",
    padding: 12,
    marginTop: 14,
  },
  activePromotionHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,

    "@media (max-width: 960px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  filterSummary: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  filterItem: {
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "#334155",
    padding: "6px 8px",
    fontSize: 12,
    lineHeight: "16px",
    overflowWrap: "anywhere",

    "& span": {
      color: "var(--color-text-muted)",
      fontWeight: "var(--font-weight-semibold)",
      marginRight: 5,
    },
  },
  split: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,

    "@media (max-width: 760px)": {
      gridTemplateColumns: "1fr",
    },
  },
  stat: {
    border: "1px solid #EEF2F6",
    borderRadius: 8,
    padding: 12,
    background: "#FAFCFE",
    minWidth: 0,

    "& span": {
      display: "block",
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "15px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
    },

    "& strong": {
      display: "block",
      marginTop: 4,
      fontSize: 14,
      lineHeight: "20px",
      overflowWrap: "anywhere",
    },
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  chip: {
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "#334155",
    padding: "4px 7px",
    fontSize: 11,
    lineHeight: "15px",
    fontWeight: "var(--font-weight-semibold)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,

    "@media (max-width: 760px)": {
      gridTemplateColumns: "1fr",
    },
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    color: "var(--color-text-secondary)",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-semibold)",
  },
  input: {
    width: "100%",
    minHeight: 38,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    padding: "8px 10px",
    boxSizing: "border-box",
    color: "var(--color-text-primary)",
    background: "var(--color-white)",
    fontSize: 13,
    lineHeight: "18px",
  },
  notice: {
    border: "1px solid rgba(210, 127, 43, 0.28)",
    borderRadius: 8,
    background: "rgba(210, 127, 43, 0.09)",
    color: "#8B5317",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: "var(--font-weight-semibold)",
    marginBottom: 12,
  },
  emptyState: {
    border: "1px solid #CFE2F3",
    borderRadius: 8,
    background: "#F5FAFF",
    color: "#23415F",
    padding: "14px 16px",
    fontSize: 13,
    lineHeight: "19px",
    marginTop: 14,

    "& strong": {
      display: "block",
      marginBottom: 4,
      fontSize: 14,
      lineHeight: "20px",
    },

    "& p": {
      margin: "4px 0 0",
    },
  },
  error: {
    border: "1px solid rgba(224, 82, 82, 0.24)",
    borderRadius: 8,
    background: "rgba(224, 82, 82, 0.08)",
    color: "#BA2F2F",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: "var(--font-weight-semibold)",
    marginBottom: 12,
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    marginTop: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 680,

    "& th": {
      textAlign: "left",
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "15px",
      padding: "8px 10px",
      borderBottom: "1px solid #EEF2F6",
      textTransform: "uppercase",
    },

    "& td": {
      padding: "9px 10px",
      borderBottom: "1px solid #F0F3F7",
      fontSize: 12,
      lineHeight: "17px",
      verticalAlign: "top",
      overflowWrap: "anywhere",
    },
  },
  mono: {
    fontFamily: "monospace",
  },
  historyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 16,
  },
  auditGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 18,
  },
  parsingManager: {
    display: "grid",
    gap: 16,
  },
  controlToolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    margin: "14px 0 12px",
  },
  segmentedControl: {
    display: "inline-flex",
    gap: 6,
    border: "1px solid #DDE6F0",
    borderRadius: 8,
    background: "#F8FAFC",
    padding: 4,
  },
  testModeButton: {
    background: "#D27F2B",
  },
  parserSourceList: {
    display: "grid",
    gap: 18,
  },
  upstreamConnectionRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  upstreamParserList: {
    display: "grid",
    gap: 14,
  },
  upstreamParserCard: {
    minWidth: 0,
    border: "1px solid #DCE7F2",
    borderRadius: 8,
    background: "#FAFCFE",
    padding: 14,
  },
  upstreamConfigPanel: {
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: 12,
    marginBottom: 14,
  },
  upstreamSubheading: {
    margin: "14px 0 10px",
    fontSize: 13,
    lineHeight: "18px",
  },
  upstreamSettingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    alignItems: "end",
    gap: 10,

    "@media (max-width: 1100px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  upstreamProgress: {
    border: "1px solid #D9E6F3",
    borderRadius: 8,
    background: "#F5FAFF",
    padding: 12,
    marginTop: 14,

    "& $error": {
      margin: "12px 0 0",
    },
  },
  upstreamProgressHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 13,
    lineHeight: "18px",
  },
  upstreamCounters: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 8,
    marginTop: 10,

    "& span": {
      border: "1px solid #E1EAF3",
      borderRadius: 8,
      background: "var(--color-white)",
      padding: "7px 8px",
      color: "var(--color-text-secondary)",
      fontSize: 11,
      lineHeight: "16px",
      overflowWrap: "anywhere",
    },

    "@media (max-width: 900px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  snapshotPanel: {
    border: "1px solid rgba(40, 157, 99, 0.24)",
    borderRadius: 8,
    background: "rgba(40, 157, 99, 0.05)",
    padding: 12,
    marginTop: 14,
  },
  snapshotHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,

    "& span": {
      display: "block",
      color: "var(--color-text-muted)",
      fontSize: 10,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
    },

    "& strong": {
      display: "block",
      marginTop: 3,
      fontSize: 12,
      lineHeight: "17px",
      overflowWrap: "anywhere",
    },
  },
  downstreamRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderTop: "1px solid rgba(40, 157, 99, 0.18)",
    paddingTop: 10,
    marginTop: 10,

    "& strong, & span": {
      display: "block",
    },

    "& strong": {
      fontSize: 13,
      lineHeight: "18px",
    },

    "& span": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "16px",
    },
  },
  actionsInline: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  upstreamTimelineHeading: {
    margin: "20px 0 0",
    fontSize: 14,
    lineHeight: "20px",
  },
  runSummaryDetails: {
    minWidth: 220,

    "& summary": {
      color: "var(--color-primary)",
      cursor: "pointer",
      fontWeight: "var(--font-weight-semibold)",
    },
  },
  jsonBlock: {
    maxWidth: 620,
    maxHeight: 360,
    overflow: "auto",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "#F8FAFC",
    padding: 10,
    margin: "8px 0 0",
    color: "#334155",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: "16px",
    whiteSpace: "pre-wrap",
  },
  parserSourceGroup: {
    display: "grid",
    gap: 10,
  },
  parserSourceHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--color-text-primary)",

    "& span": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "15px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
    },

    "& strong": {
      fontSize: 14,
      lineHeight: "20px",
    },
  },
  parserCards: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,

    "@media (max-width: 1000px)": {
      gridTemplateColumns: "1fr",
    },
  },
  parserCard: {
    minWidth: 0,
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    background: "#FAFCFE",
    padding: 14,
  },
  parserCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,

    "& h3": {
      margin: "0 0 3px",
      fontSize: 16,
      lineHeight: "22px",
    },

    "& code": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "15px",
      overflowWrap: "anywhere",
    },

    "@media (max-width: 560px)": {
      flexDirection: "column",
    },
  },
  parserDescription: {
    minHeight: 34,
    margin: "10px 0",
    color: "var(--color-text-muted)",
    fontSize: 12,
    lineHeight: "17px",
  },
  parserMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 7,
    marginBottom: 12,

    "& div": {
      minWidth: 0,
      border: "1px solid #EEF2F6",
      borderRadius: 8,
      background: "var(--color-white)",
      padding: "8px 9px",
    },

    "& span": {
      display: "block",
      color: "var(--color-text-muted)",
      fontSize: 10,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
    },

    "& strong": {
      display: "block",
      marginTop: 3,
      fontSize: 12,
      lineHeight: "17px",
      overflowWrap: "anywhere",
    },

    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  parserSettingsGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(120px, 0.65fr)",
    gap: 10,

    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  parserToggleRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },
  checkboxControl: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    color: "var(--color-text-secondary)",
    fontSize: 12,
    lineHeight: "17px",
    fontWeight: "var(--font-weight-semibold)",
    cursor: "pointer",
  },
  writeBlockedReason: {
    margin: "10px 0 0",
    color: "#9A5B12",
    fontSize: 12,
    lineHeight: "17px",
    overflowWrap: "anywhere",
  },
  creditProgress: {
    height: 8,
    borderRadius: 999,
    background: "#E6EBF1",
    overflow: "hidden",
    marginTop: 12,
  },
  creditProgressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 180ms ease",
  },
  creditUsageMeta: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 9,
    color: "var(--color-text-muted)",
    fontSize: 12,
    lineHeight: "17px",
  },
  sourceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,

    "@media (max-width: 1100px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    "@media (max-width: 760px)": {
      gridTemplateColumns: "1fr",
    },
  },
  sourceCard: {
    minWidth: 0,
    border: "1px solid #E6EBF1",
    borderRadius: 8,
    background: "#FAFCFE",
    padding: 12,

    "& strong": {
      fontSize: 14,
      lineHeight: "20px",
    },
  },
  sourceCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  pipeline: {
    display: "grid",
    gridTemplateColumns: "repeat(13, minmax(0, auto))",
    alignItems: "center",
    gap: 8,

    "@media (max-width: 1100px)": {
      gridTemplateColumns: "1fr",
      alignItems: "stretch",
    },
  },
  pipelineStep: {
    border: "1px solid #DDE6F0",
    borderRadius: 8,
    background: "#F8FAFC",
    padding: "10px 12px",
    textAlign: "center",
    color: "var(--color-text-primary)",
    fontSize: 12,
    lineHeight: "17px",
    fontWeight: "var(--font-weight-semibold)",
  },
  pipelineArrow: {
    color: "var(--color-text-muted)",
    fontSize: 12,
    lineHeight: "17px",
    textAlign: "center",

    "@media (max-width: 1100px)": {
      transform: "rotate(90deg)",
    },
  },
  futureControls: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 12,

    "@media (max-width: 1100px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    "@media (max-width: 760px)": {
      gridTemplateColumns: "1fr",
    },
  },
  safetyNotice: {
    border: "1px solid rgba(40, 157, 99, 0.32)",
    borderRadius: 8,
    background: "rgba(40, 157, 99, 0.09)",
    color: "#19764A",
    padding: "12px 14px",
    fontSize: 13,
    lineHeight: "19px",
    fontWeight: "var(--font-weight-semibold)",
  },
});
