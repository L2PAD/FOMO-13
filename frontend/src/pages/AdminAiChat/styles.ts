import { createUseStyles } from "react-jss";

const shadow = "0 18px 44px rgba(18, 28, 45, 0.10)";
const border = "1px solid var(--color-border-strong)";

export const useStyles = createUseStyles({
  "@keyframes messageIn": {
    from: {
      opacity: 0,
      transform: "translateY(8px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
  "@keyframes shimmer": {
    from: {
      backgroundPosition: "120% 0",
    },
    to: {
      backgroundPosition: "-120% 0",
    },
  },
  "@keyframes dotPulse": {
    "0%, 80%, 100%": {
      opacity: 0.28,
      transform: "translateY(0)",
    },
    "40%": {
      opacity: 1,
      transform: "translateY(-3px)",
    },
  },
  "@keyframes modalIn": {
    from: {
      opacity: 0,
      transform: "translateY(10px) scale(0.98)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0) scale(1)",
    },
  },
  page: {
    height: "calc(100dvh - 104px)",
    minHeight: 0,
    background: "var(--color-surface-muted)",
    color: "var(--color-text-strong)",
    fontWeight: "var(--font-weight-regular)",
    overflow: "hidden",
    padding: "18px 22px 22px",
    boxSizing: "border-box",

    "& button": {
      fontFamily: "inherit",
    },

    "@media (max-width: 720px)": {
      height: "auto",
      minHeight: "calc(100dvh - 132px)",
      overflow: "visible",
      padding: 12,
    },
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "336px minmax(0, 1fr)",
    gap: 16,
    height: "100%",
    minHeight: 0,
    transition: "grid-template-columns 0.2s ease",

    "@media (max-width: 980px)": {
      gridTemplateColumns: "1fr",
      height: "auto",
      minHeight: "calc(100dvh - 156px)",
    },
  },
  collapsedShell: {
    gridTemplateColumns: "72px minmax(0, 1fr)",

    "@media (max-width: 980px)": {
      gridTemplateColumns: "1fr",
    },
  },
  sidebar: {
    display: "grid",
    gridTemplateRows: "auto auto auto minmax(0, 1fr)",
    minWidth: 0,
    background: "var(--color-white)",
    border,
    borderRadius: 8,
    boxShadow: shadow,
    overflow: "hidden",

    "@media (max-width: 980px)": {
      maxHeight: "48vh",
    },
  },
  collapsedSidebar: {
    gridTemplateRows: "auto minmax(0, 1fr)",

    "@media (max-width: 980px)": {
      maxHeight: 78,
    },
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottom: "1px solid var(--color-border-subtle)",

    "& h1": {
      margin: 0,
      color: "var(--color-text-primary)",
      fontSize: 20,
      lineHeight: "24px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& span": {
      display: "block",
      marginTop: 3,
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-regular)",
    },
  },
  collapseButton: {
    display: "grid",
    placeItems: "center",
    width: 40,
    height: 40,
    flex: "0 0 40px",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease",

    "&:hover": {
      background: "var(--color-surface-subtle)",
      borderColor: "#B9C7D6",
    },

    "&:active": {
      transform: "scale(0.96)",
    },
  },
  sidebarActions: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 42px",
    gap: 10,
    padding: 14,
  },
  newButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 42,
    border: "none",
    borderRadius: 8,
    background: "#04A584",
    color: "var(--color-white)",
    padding: "10px 14px",
    fontSize: 14,
    lineHeight: "18px",
    fontWeight: "var(--font-weight-semibold)",
    cursor: "pointer",
    transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
    boxShadow: "0 10px 22px rgba(4, 165, 132, 0.22)",

    "&:hover": {
      background: "#038E72",
    },

    "&:active": {
      transform: "translateY(1px)",
    },

    "&:disabled": {
      opacity: 0.56,
      cursor: "not-allowed",
      boxShadow: "none",
      transform: "none",
    },
  },
  iconOnlyButton: {
    display: "grid",
    placeItems: "center",
    minWidth: 42,
    minHeight: 42,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",

    "&:hover": {
      background: "var(--color-surface-subtle)",
      borderColor: "var(--color-primary)",
      color: "#048A70",
    },
  },
  searchBox: {
    display: "grid",
    gridTemplateColumns: "20px minmax(0, 1fr) 28px",
    alignItems: "center",
    gap: 8,
    margin: "0 14px 12px",
    padding: "0 8px 0 12px",
    minHeight: 42,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface-raised)",
    color: "var(--color-text-muted)",
    transition: "border-color 0.18s ease, background 0.18s ease",

    "&:focus-within": {
      borderColor: "var(--color-primary)",
      background: "var(--color-white)",
    },

    "& input": {
      width: "100%",
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "var(--color-text-primary)",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-regular)",
    },

    "& button": {
      display: "grid",
      placeItems: "center",
      width: 28,
      height: 28,
      border: "none",
      borderRadius: 8,
      background: "transparent",
      color: "var(--color-text-muted)",
      cursor: "pointer",
    },
  },
  threadList: {
    minHeight: 0,
    overflowY: "auto",
    padding: "0 10px 12px",
  },
  skeletonList: {
    display: "grid",
    gap: 10,
    padding: 4,
  },
  skeletonItem: {
    display: "grid",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    border: "1px solid var(--color-border-subtle)",
    background: "var(--color-white)",

    "& span, & strong": {
      display: "block",
      height: 12,
      borderRadius: 8,
      background: "linear-gradient(90deg, var(--color-border-subtle) 0%, var(--color-surface-raised) 45%, var(--color-border-subtle) 90%)",
      backgroundSize: "240% 100%",
      animation: "$shimmer 1.4s ease-in-out infinite",
    },

    "& span": {
      width: "70%",
    },

    "& strong": {
      width: "92%",
    },
  },
  sidebarEmpty: {
    display: "grid",
    placeItems: "center",
    gap: 7,
    padding: "28px 16px",
    color: "var(--color-text-muted)",
    textAlign: "center",

    "& strong": {
      color: "var(--color-text-primary)",
      fontSize: 14,
      lineHeight: "18px",
    },

    "& span": {
      maxWidth: 220,
      fontSize: 12,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-regular)",
    },
  },
  sidebarEmptySmall: {
    padding: "10px 12px 12px",
    color: "var(--color-text-soft)",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-regular)",
  },
  folderSection: {
    position: "relative",
    marginBottom: 8,
  },
  folderHeader: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "26px 18px minmax(0, 1fr) auto 30px",
    alignItems: "center",
    gap: 7,
    minHeight: 36,
    padding: "0 4px 0 2px",
    color: "var(--color-text-secondary)",

    "& > span": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& small": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 22,
      height: 20,
      borderRadius: 8,
      background: "#EEF5F3",
      color: "var(--color-primary-dark)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
    },
  },
  folderToggle: {
    display: "grid",
    placeItems: "center",
    width: 26,
    height: 26,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-text-muted)",
    cursor: "pointer",
    transition: "background 0.18s ease, transform 0.18s ease",

    "&:hover": {
      background: "var(--color-border-subtle)",
    },
  },
  folderOpen: {
    "& svg": {
      transform: "rotate(90deg)",
    },
  },
  folderBody: {
    display: "grid",
    gap: 8,
    padding: "2px 0 4px",
  },
  folderMenuButton: {
    display: "grid",
    placeItems: "center",
    width: 30,
    height: 30,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-text-muted)",
    cursor: "pointer",

    "&:hover": {
      background: "var(--color-border-subtle)",
      color: "var(--color-text-primary)",
    },
  },
  threadButton: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 32px",
    gap: 8,
    alignItems: "center",
    width: "100%",
    minHeight: 70,
    border: "1px solid #EDF2F6",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
    padding: "10px 8px 10px 12px",
    textAlign: "left",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "border-color 0.18s ease, background 0.18s ease, transform 0.18s ease",

    "&:hover": {
      borderColor: "#C9D5E1",
      background: "#FAFCFE",
      transform: "translateY(-1px)",

      "& $threadMenuButton": {
        opacity: 1,
      },
    },
  },
  activeThread: {
    borderColor: "var(--color-primary)",
    background: "#EFFAF7",
    boxShadow: "inset 3px 0 0 var(--color-primary)",
  },
  threadMain: {
    minWidth: 0,
  },
  threadTitleRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 6,
  },
  threadTitle: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--color-text-primary)",
    fontSize: 14,
    lineHeight: "19px",
    fontWeight: "var(--font-weight-medium)",
  },
  pinBadge: {
    display: "grid",
    placeItems: "center",
    width: 22,
    height: 22,
    borderRadius: 8,
    background: "#FFF3D8",
    color: "#9F6500",

    "& svg": {
      width: 14,
      height: 14,
    },
  },
  threadMeta: {
    display: "block",
    marginTop: 5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--color-text-muted)",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-regular)",
  },
  threadMenuButton: {
    display: "grid",
    placeItems: "center",
    width: 32,
    height: 32,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-text-muted)",
    cursor: "pointer",
    opacity: 0.72,
    transition: "background 0.18s ease, opacity 0.18s ease, color 0.18s ease",

    "&:hover": {
      background: "var(--color-border-subtle)",
      color: "var(--color-text-primary)",
      opacity: 1,
    },
  },
  dropdownMenu: {
    position: "absolute",
    top: 34,
    right: 8,
    zIndex: 20,
    display: "grid",
    minWidth: 184,
    padding: 6,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    boxShadow: "0 16px 38px rgba(18, 28, 45, 0.16)",
    animation: "$messageIn 0.16s ease both",

    "& button": {
      display: "grid",
      gridTemplateColumns: "18px minmax(0, 1fr)",
      alignItems: "center",
      gap: 8,
      minHeight: 36,
      border: "none",
      borderRadius: 8,
      background: "transparent",
      color: "var(--color-text-primary)",
      padding: "8px 9px",
      textAlign: "left",
      fontSize: 13,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",

      "&:hover": {
        background: "#F3F7FA",
      },
    },
  },
  dangerMenuItem: {
    color: "var(--color-danger-dark) !important",

    "&:hover": {
      background: "rgba(196, 63, 63, 0.08) !important",
    },
  },
  collapsedActions: {
    display: "grid",
    justifyItems: "center",
    alignContent: "start",
    gap: 10,
    padding: 14,

    "& button": {
      display: "grid",
      placeItems: "center",
      width: 42,
      height: 42,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-primary)",
      cursor: "pointer",

      "&:hover": {
        background: "var(--color-surface-subtle)",
        color: "#048A70",
      },
    },
  },
  chatPanel: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    background: "var(--color-white)",
    border,
    borderRadius: 8,
    boxShadow: shadow,
    overflow: "hidden",

    "@media (max-width: 980px)": {
      minHeight: "70vh",
    },
  },
  fullscreenChatPanel: {
    position: "fixed",
    inset: 12,
    zIndex: 1000,
    height: "calc(100dvh - 24px)",
    width: "calc(100vw - 24px)",
    borderRadius: 8,

    "@media (max-width: 640px)": {
      inset: 0,
      width: "100vw",
      height: "100dvh",
      borderRadius: 0,
    },
  },
  chatHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "18px 20px",
    borderBottom: "1px solid var(--color-border-subtle)",
    background: "var(--color-white)",

    "& > div:first-child": {
      minWidth: 160,
      flex: "1 1 220px",
    },

    "& h2": {
      margin: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "var(--color-text-primary)",
      fontSize: 22,
      lineHeight: "28px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& p": {
      margin: "4px 0 0",
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-regular)",
    },

    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
      padding: 14,

      "& h2": {
        fontSize: 18,
        lineHeight: "24px",
      },
    },
  },
  chatHeaderActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flex: "1 1 auto",
    minWidth: 0,

    "& button": {
      display: "grid",
      placeItems: "center",
      width: 38,
      height: 38,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-secondary)",
      cursor: "pointer",
      transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",

      "&:hover": {
        background: "var(--color-surface-subtle)",
        borderColor: "var(--color-primary)",
        color: "var(--color-primary)",
      },

      '&[aria-pressed="true"]': {
        background: "var(--color-primary)",
        borderColor: "var(--color-primary)",
        color: "var(--color-white)",
      },
    },

    "@media (max-width: 640px)": {
      justifyContent: "flex-start",
      flexWrap: "wrap",
    },
  },
  modelSelect: {
    display: "grid",
    gridTemplateColumns: "auto minmax(148px, 1fr)",
    alignItems: "center",
    gap: 8,
    minHeight: 38,
    maxWidth: 280,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-secondary)",
    padding: "0 9px",
    boxSizing: "border-box",

    "& span": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& select": {
      width: "100%",
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "var(--color-text-primary)",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2304A584' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 2px center",
      paddingRight: 18,
    },

    "&:focus-within": {
      borderColor: "var(--color-primary)",
      boxShadow: "0 0 0 3px rgba(4, 165, 132, 0.14)",
    },

    "@media (max-width: 640px)": {
      width: "100%",
      maxWidth: "100%",
      gridTemplateColumns: "auto minmax(0, 1fr)",
    },
  },
  accessModeControl: {
    display: "grid",
    gridTemplateColumns: "auto minmax(178px, 1fr) auto",
    alignItems: "center",
    gap: 8,
    minHeight: 38,
    maxWidth: 420,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: "0 7px 0 9px",
    boxSizing: "border-box",

    "& > span": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },

    "& select": {
      width: "100%",
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "var(--color-text-primary)",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2304A584' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 2px center",
      paddingRight: 18,

      "&:disabled": {
        color: "var(--color-text-muted)",
        cursor: "not-allowed",
      },
    },

    "&:focus-within": {
      borderColor: "var(--color-primary)",
      boxShadow: "0 0 0 3px rgba(4, 165, 132, 0.14)",
    },

    "@media (max-width: 980px)": {
      width: "100%",
      maxWidth: "100%",
      gridTemplateColumns: "auto minmax(0, 1fr)",

      "& em": {
        gridColumn: "1 / -1",
        width: "fit-content",
      },
    },

    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  accessModeBadge: {
    borderRadius: 8,
    background: "#EAF7F3",
    color: "var(--color-primary-dark)",
    padding: "4px 7px",
    fontSize: 11,
    lineHeight: "14px",
    fontStyle: "normal",
    fontWeight: "var(--font-weight-medium)",
    whiteSpace: "nowrap",
  },
  accessModeFullBadge: {
    background: "#FFF4E2",
    color: "#92540D",
  },
  messages: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minHeight: 0,
    overflowY: "auto",
    padding: "24px 22px 28px",
    background: "var(--color-surface-raised)",

    "@media (max-width: 980px)": {
      minHeight: 420,
    },

    "@media (max-width: 640px)": {
      padding: "16px 12px 18px",
    },
  },
  messagesSkeleton: {
    display: "grid",
    gap: 14,
    width: "min(760px, 100%)",
    margin: "auto",

    "& div": {
      height: 76,
      borderRadius: 8,
      background: "linear-gradient(90deg, var(--color-border-subtle) 0%, var(--color-white) 45%, var(--color-border-subtle) 90%)",
      backgroundSize: "240% 100%",
      animation: "$shimmer 1.4s ease-in-out infinite",
    },
  },
  messageRow: {
    display: "grid",
    gridTemplateColumns: "34px minmax(0, max-content)",
    alignItems: "start",
    gap: 10,
    width: "100%",
    animation: "$messageIn 0.2s ease both",
  },
  userRow: {
    gridTemplateColumns: "minmax(0, max-content) 34px",
    justifyContent: "end",

    "& $messageAvatar": {
      order: 2,
    },
  },
  assistantRow: {
    justifyContent: "start",
  },
  messageAvatar: {
    display: "grid",
    placeItems: "center",
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "var(--color-text-primary)",
    color: "var(--color-white)",
    fontSize: 13,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-medium)",
  },
  userAvatar: {
    background: "var(--color-primary)",
  },
  systemAvatar: {
    background: "var(--color-text-muted)",
  },
  bubble: {
    position: "relative",
    width: "fit-content",
    maxWidth: "min(780px, calc(100vw - 520px))",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: "13px 14px",
    boxSizing: "border-box",
    color: "var(--color-text-primary)",
    fontSize: 14,
    lineHeight: "22px",
    boxShadow: "0 8px 22px rgba(18, 28, 45, 0.06)",

    "@media (max-width: 1100px)": {
      maxWidth: "min(780px, calc(100vw - 180px))",
    },

    "@media (max-width: 640px)": {
      maxWidth: "calc(100vw - 88px)",
    },
  },
  userBubble: {
    background: "var(--color-primary)",
    borderColor: "var(--color-primary)",
    color: "var(--color-white)",
  },
  systemBubble: {
    background: "var(--color-surface-muted)",
  },
  errorBubble: {
    borderColor: "rgba(196, 63, 63, 0.26)",
    background: "#FFF6F6",
    color: "var(--color-danger-dark)",
  },
  pendingBubble: {
    minWidth: 320,
    background: "var(--color-white)",
  },
  bubbleMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 8,
    color: "var(--color-text-muted)",
    fontSize: 11,
    lineHeight: "14px",
    fontWeight: "var(--font-weight-medium)",
    textTransform: "uppercase",
  },
  userMeta: {
    color: "rgba(255, 255, 255, 0.78)",
  },
  messageContent: {
    "& p": {
      margin: "0 0 10px",

      "&:last-child": {
        marginBottom: 0,
      },
    },

    "& code": {
      display: "inline-block",
      borderRadius: 6,
      background: "rgba(15, 23, 42, 0.08)",
      padding: "1px 5px",
      color: "#101827",
      fontFamily: "Consolas, Monaco, monospace",
      fontSize: 13,
      lineHeight: "18px",
      overflowWrap: "anywhere",
    },

    "$userBubble & code": {
      background: "rgba(255, 255, 255, 0.18)",
      color: "var(--color-white)",
    },
  },
  assistantMetaLine: {
    display: "inline-flex",
    width: "fit-content",
    maxWidth: "100%",
    margin: "0 0 10px",
    border: "1px solid #D7E2EA",
    borderRadius: 8,
    background: "#F5FAF8",
    color: "var(--color-text-secondary)",
    padding: "4px 8px",
    fontSize: 11,
    lineHeight: "15px",
    fontWeight: "var(--font-weight-medium)",
    overflowWrap: "anywhere",
  },
  messageActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 10,
  },
  artifactList: {
    display: "grid",
    gap: 9,
    marginTop: 12,
  },
  artifactCard: {
    minWidth: 320,
    border: "1px solid #D7E2EA",
    borderRadius: 8,
    background: "#F8FBFA",
    padding: 11,

    "@media (max-width: 640px)": {
      minWidth: 0,
    },
  },
  artifactCardFailed: {
    borderColor: "rgba(196, 63, 63, 0.28)",
    background: "#FFF7F7",
  },
  artifactHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,

    "& > div": {
      display: "grid",
      minWidth: 0,
    },

    "& strong": {
      overflow: "hidden",
      color: "var(--color-text-primary)",
      fontSize: 13,
      lineHeight: "18px",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    "& div > span": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "16px",
    },
  },
  artifactStatus: {
    flexShrink: 0,
    borderRadius: 999,
    background: "#EAF7F3",
    color: "var(--color-primary-dark)",
    padding: "3px 7px",
    fontSize: 11,
    lineHeight: "15px",
    fontWeight: "var(--font-weight-medium)",
  },
  artifactProgress: {
    height: 5,
    overflow: "hidden",
    marginTop: 10,
    borderRadius: 999,
    background: "#DFE9E6",

    "& span": {
      display: "block",
      height: "100%",
      borderRadius: 999,
      background: "var(--color-primary)",
      transition: "width 0.25s ease",
    },
  },
  artifactFacts: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 9,

    "& span": {
      borderRadius: 5,
      background: "#EDF3F1",
      color: "var(--color-text-secondary)",
      padding: "2px 6px",
      fontSize: 10,
      lineHeight: "15px",
    },
  },
  artifactError: {
    marginTop: 8,
    color: "var(--color-danger-dark)",
    fontSize: 12,
    lineHeight: "17px",
  },
  artifactDownload: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    border: 0,
    borderRadius: 8,
    background: "var(--color-primary)",
    color: "var(--color-white)",
    padding: "7px 10px",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-medium)",
    cursor: "pointer",

    "& svg": {
      width: 15,
      height: 15,
    },

    "&:hover": {
      background: "var(--color-primary-dark)",
    },
  },
  toolRunsButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    minHeight: 30,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "#F5FAF8",
    color: "var(--color-primary-dark)",
    padding: "6px 9px",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "var(--font-weight-medium)",
    cursor: "pointer",

    "& svg": {
      width: 15,
      height: 15,
    },

    "&:hover": {
      borderColor: "var(--color-primary)",
      background: "#EFFAF7",
    },
  },
  ghostIconButton: {
    display: "grid",
    placeItems: "center",
    width: 30,
    height: 30,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-muted)",
    cursor: "pointer",

    "&:hover": {
      borderColor: "var(--color-primary)",
      color: "#048A70",
    },
  },
  codeBlock: {
    maxWidth: "100%",
    overflowX: "auto",
    margin: "10px 0",
    border: "1px solid #D9E1EA",
    borderRadius: 8,
    background: "#101827",
    color: "var(--color-surface-subtle)",
    padding: 12,
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: 13,
    lineHeight: "20px",

    "& code": {
      background: "transparent",
      color: "inherit",
      padding: 0,
      borderRadius: 0,
    },
  },
  markdownList: {
    margin: "6px 0 10px",
    paddingLeft: 22,

    "& li": {
      marginBottom: 4,
    },
  },
  pendingLine: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    color: "var(--color-text-primary)",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: "var(--font-weight-medium)",

    "& i": {
      display: "block",
      width: 6,
      height: 6,
      borderRadius: 8,
      background: "var(--color-primary)",
      animation: "$dotPulse 1.2s ease-in-out infinite",

      "&:nth-child(3)": {
        animationDelay: "0.14s",
      },

      "&:nth-child(4)": {
        animationDelay: "0.28s",
      },
    },
  },
  pendingShimmer: {
    height: 10,
    width: "86%",
    marginTop: 14,
    borderRadius: 8,
    background: "linear-gradient(90deg, var(--color-border-subtle) 0%, var(--color-white) 45%, var(--color-border-subtle) 90%)",
    backgroundSize: "240% 100%",
    animation: "$shimmer 1.25s ease-in-out infinite",
  },
  requestError: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 12,
    width: "min(760px, 100%)",
    margin: "0 auto",
    border: "1px solid rgba(196, 63, 63, 0.24)",
    borderRadius: 8,
    background: "#FFF6F6",
    color: "var(--color-danger-dark)",
    padding: 12,
    boxSizing: "border-box",

    "& strong": {
      display: "block",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-medium)",
    },

    "& span": {
      display: "block",
      marginTop: 2,
      fontSize: 12,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-regular)",
    },

    "& button": {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      minHeight: 36,
      border: "none",
      borderRadius: 8,
      background: "var(--color-danger-dark)",
      color: "var(--color-white)",
      padding: "8px 12px",
      fontSize: 13,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",
    },

    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  welcomeState: {
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 12,
    width: "min(820px, 100%)",
    minHeight: 360,
    margin: "auto",
    textAlign: "center",
    color: "var(--color-text-muted)",

    "& h2": {
      margin: 0,
      color: "#101827",
      fontSize: 26,
      lineHeight: "32px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& p": {
      maxWidth: 560,
      margin: 0,
      fontSize: 14,
      lineHeight: "22px",
      fontWeight: "var(--font-weight-regular)",
    },
  },
  welcomeIcon: {
    display: "grid",
    placeItems: "center",
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "linear-gradient(135deg, #04A584 0%, #037A63 100%)",
    color: "var(--color-white)",
    boxShadow: "0 14px 32px rgba(4, 165, 132, 0.28)",

    "& svg": {
      width: 24,
      height: 24,
    },
  },
  starters: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 8,

    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  starterButton: {
    minHeight: 46,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: "var(--font-weight-medium)",
    textAlign: "left",
    cursor: "pointer",
    overflowWrap: "anywhere",
    transition: "border-color 0.18s ease, background 0.18s ease, transform 0.18s ease",

    "&:hover": {
      borderColor: "var(--color-primary)",
      background: "#EFFAF7",
      transform: "translateY(-1px)",
    },
  },
  composer: {
    padding: 16,
    borderTop: "1px solid var(--color-border-subtle)",
    background: "var(--color-white)",

    "@media (max-width: 640px)": {
      padding: 12,
    },
  },
  composerBox: {
    display: "grid",
    gap: 10,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: 10,
    boxShadow: "0 10px 28px rgba(18, 28, 45, 0.08)",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",

    "&:focus-within": {
      borderColor: "var(--color-primary)",
      boxShadow: "0 12px 30px rgba(4, 165, 132, 0.14)",
    },
  },
  textarea: {
    width: "100%",
    minHeight: 48,
    maxHeight: 188,
    resize: "none",
    border: "none",
    outline: "none",
    color: "var(--color-text-primary)",
    fontSize: 14,
    lineHeight: "22px",
    fontWeight: "var(--font-weight-regular)",
    boxSizing: "border-box",
    background: "var(--color-white)",
    overflowY: "auto",

    "&::placeholder": {
      color: "var(--color-text-soft)",
    },

    "&:disabled": {
      color: "var(--color-text-soft)",
      cursor: "not-allowed",
    },
  },
  composerFooter: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 10,

    "& span": {
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-regular)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  },
  sendButton: {
    display: "grid",
    placeItems: "center",
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 8,
    background: "#04A584",
    color: "var(--color-white)",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(4, 165, 132, 0.24)",
    transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",

    "&:hover": {
      background: "#038E72",
    },

    "&:active": {
      transform: "scale(0.96)",
    },

    "&:disabled": {
      background: "#D9E5E2",
      color: "#8DA09A",
      boxShadow: "none",
      cursor: "not-allowed",
      transform: "none",
    },
  },
  modalLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 100000,
    display: "grid",
    placeItems: "center",
    padding: 18,
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    border: "none",
    background: "rgba(8, 15, 29, 0.48)",
    cursor: "pointer",
  },
  modalCard: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gap: 16,
    width: "min(460px, 100%)",
    border: "1px solid rgba(221, 230, 238, 0.86)",
    borderRadius: 8,
    background: "var(--color-white)",
    boxShadow: "0 24px 80px rgba(8, 15, 29, 0.28)",
    padding: 18,
    boxSizing: "border-box",
    animation: "$modalIn 0.18s ease both",
  },
  modalHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 34px",
    alignItems: "center",
    gap: 10,

    "& h3": {
      margin: 0,
      color: "var(--color-text-primary)",
      fontSize: 18,
      lineHeight: "24px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& button": {
      display: "grid",
      placeItems: "center",
      width: 34,
      height: 34,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-muted)",
      cursor: "pointer",
    },
  },
  modalField: {
    display: "grid",
    gap: 7,

    "& span": {
      color: "var(--color-text-secondary)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& input": {
      width: "100%",
      minHeight: 42,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      outline: "none",
      padding: "9px 11px",
      color: "var(--color-text-primary)",
      fontSize: 14,
      lineHeight: "20px",
      fontWeight: "var(--font-weight-regular)",
      boxSizing: "border-box",

      "&:focus": {
        borderColor: "var(--color-primary)",
      },
    },
  },
  moveList: {
    display: "grid",
    gap: 8,
    maxHeight: 260,
    overflowY: "auto",

    "& button": {
      display: "grid",
      gridTemplateColumns: "18px minmax(0, 1fr)",
      alignItems: "center",
      gap: 9,
      minHeight: 40,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-primary)",
      padding: "9px 11px",
      textAlign: "left",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",

      "&:hover": {
        borderColor: "var(--color-primary)",
      },
    },
  },
  activeMoveOption: {
    borderColor: "var(--color-primary) !important",
    background: "#EFFAF7 !important",
    color: "var(--color-primary-dark) !important",
  },
  confirmText: {
    margin: 0,
    color: "var(--color-text-secondary)",
    fontSize: 14,
    lineHeight: "22px",
    fontWeight: "var(--font-weight-regular)",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,

    "& button": {
      minHeight: 38,
      borderRadius: 8,
      padding: "9px 13px",
      fontSize: 13,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",
    },
  },
  secondaryButton: {
    border: "1px solid var(--color-border)",
    background: "var(--color-white)",
    color: "var(--color-text-primary)",
  },
  primaryButton: {
    border: "none",
    background: "var(--color-primary)",
    color: "var(--color-white)",
  },
  dangerButton: {
    border: "none",
    background: "var(--color-danger-dark)",
    color: "var(--color-white)",
  },
  toolRunsLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 100001,
    display: "grid",
    justifyItems: "end",
  },
  toolRunsBackdrop: {
    position: "absolute",
    inset: 0,
    border: "none",
    background: "rgba(8, 15, 29, 0.34)",
    cursor: "pointer",
  },
  toolRunsDrawer: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateRows: "auto auto minmax(0, 1fr)",
    width: "min(560px, 100vw)",
    height: "100dvh",
    background: "var(--color-white)",
    borderLeft: "1px solid var(--color-border-strong)",
    boxShadow: "-18px 0 52px rgba(8, 15, 29, 0.20)",
  },
  toolRunsHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 38px",
    alignItems: "start",
    gap: 14,
    padding: "20px 20px 16px",
    borderBottom: "1px solid var(--color-border-subtle)",

    "& span": {
      color: "var(--color-primary-dark)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& h3": {
      margin: "3px 0 0",
      color: "var(--color-text-primary)",
      fontSize: 22,
      lineHeight: "28px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& p": {
      margin: "5px 0 0",
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-regular)",
      overflowWrap: "anywhere",
    },

    "& button": {
      display: "grid",
      placeItems: "center",
      width: 38,
      height: 38,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-muted)",
      cursor: "pointer",
    },
  },
  toolRunsMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    padding: 16,
    borderBottom: "1px solid var(--color-border-subtle)",
    background: "var(--color-surface-raised)",

    "& div": {
      minWidth: 0,
      border: "1px solid var(--color-border-subtle)",
      borderRadius: 8,
      background: "var(--color-white)",
      padding: "9px 10px",
    },

    "& span": {
      display: "block",
      color: "var(--color-text-muted)",
      fontSize: 10,
      lineHeight: "13px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& strong": {
      display: "block",
      marginTop: 4,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "var(--color-text-primary)",
      fontSize: 12,
      lineHeight: "17px",
      fontWeight: "var(--font-weight-medium)",
    },

    "@media (max-width: 520px)": {
      gridTemplateColumns: "1fr",
    },
  },
  toolRunsBody: {
    minHeight: 0,
    overflowY: "auto",
    display: "grid",
    alignContent: "start",
    gap: 12,
    padding: 16,
    background: "var(--color-surface-raised)",
  },
  toolRunsState: {
    display: "grid",
    justifyItems: "center",
    gap: 7,
    border: "1px solid var(--color-border-subtle)",
    borderRadius: 8,
    background: "var(--color-white)",
    color: "var(--color-text-muted)",
    padding: "28px 18px",
    textAlign: "center",

    "& strong": {
      color: "var(--color-text-primary)",
      fontSize: 14,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& span": {
      fontSize: 12,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-regular)",
    },

    "& button": {
      minHeight: 34,
      border: "none",
      borderRadius: 8,
      background: "var(--color-danger-dark)",
      color: "var(--color-white)",
      padding: "7px 12px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",
    },
  },
  toolRunsError: {
    borderColor: "rgba(196, 63, 63, 0.24)",
    color: "var(--color-danger-dark)",
  },
  toolRunCard: {
    display: "grid",
    gap: 10,
    border: "1px solid var(--color-border-strong)",
    borderRadius: 8,
    background: "var(--color-white)",
    padding: 13,
    boxShadow: "0 8px 22px rgba(18, 28, 45, 0.06)",
  },
  toolRunCardHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 10,
    alignItems: "start",

    "& strong": {
      display: "block",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "var(--color-text-primary)",
      fontSize: 14,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& span": {
      display: "block",
      marginTop: 3,
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-regular)",
    },

    "& em": {
      minWidth: 64,
      borderRadius: 8,
      background: "#EAF7F3",
      color: "var(--color-primary-dark)",
      padding: "4px 8px",
      textAlign: "center",
      fontSize: 11,
      lineHeight: "14px",
      fontStyle: "normal",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },
  },
  toolRunFailed: {
    background: "#FFF0F0 !important",
    color: "var(--color-danger-dark) !important",
  },
  toolRunPending: {
    background: "#FFF4E2 !important",
    color: "#92540D !important",
  },
  toolRunBlocked: {
    background: "#F1F4F7 !important",
    color: "var(--color-text-secondary) !important",
  },
  toolRunFacts: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,

    "& span": {
      borderRadius: 8,
      background: "var(--color-surface-muted)",
      color: "var(--color-text-secondary)",
      padding: "4px 7px",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      overflowWrap: "anywhere",
    },
  },
  toolRunCollections: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,

    "& span": {
      border: "1px solid #D7E2EA",
      borderRadius: 8,
      background: "#F8FBFD",
      color: "var(--color-text-secondary)",
      padding: "4px 7px",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
    },
  },
  toolRunApproval: {
    display: "grid",
    gap: 8,
    borderLeft: "3px solid #D8941C",
    background: "#FFF9EF",
    padding: "10px 0 10px 11px",

    "& strong": {
      color: "var(--color-text-primary)",
      fontSize: 13,
      lineHeight: "17px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& > div": {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
    },

    "& span": {
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-secondary)",
      padding: "4px 7px",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      overflowWrap: "anywhere",
    },

    "& pre": {
      maxHeight: 180,
      overflow: "auto",
      margin: 0,
      border: "1px solid #F1DDB8",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-primary)",
      padding: 9,
      fontFamily: "Consolas, Monaco, monospace",
      fontSize: 12,
      lineHeight: "18px",
    },
  },
  toolRunApprovalActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,

    "& button": {
      minHeight: 32,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-primary)",
      padding: "7px 11px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",

      "&:first-child": {
        borderColor: "var(--color-primary)",
        background: "var(--color-primary)",
        color: "var(--color-white)",
      },

      "&:disabled": {
        opacity: 0.56,
        cursor: "not-allowed",
      },
    },
  },
  toolRunCompareAction: {
    display: "flex",

    "& button": {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      minHeight: 34,
      border: "1px solid #A8D9CD",
      borderRadius: 8,
      background: "#EFFAF7",
      color: "#04775F",
      padding: "7px 11px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",

      "& svg": {
        width: 14,
        height: 14,
      },
    },
  },
  toolRunSummaryBlock: {
    display: "grid",
    gap: 7,

    "& > button": {
      justifySelf: "start",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: 30,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-secondary)",
      padding: "6px 9px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",

      "& svg": {
        width: 14,
        height: 14,
      },

      "&:hover": {
        borderColor: "var(--color-primary)",
        color: "var(--color-primary-dark)",
      },
    },
  },
  toolRunSuggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,

    "& span": {
      borderRadius: 8,
      background: "#EFF6FF",
      color: "#24518A",
      padding: "4px 7px",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      overflowWrap: "anywhere",
    },
  },
  toolRunSummary: {
    maxWidth: "100%",
    maxHeight: 260,
    overflow: "auto",
    margin: 0,
    border: "1px solid #D9E1EA",
    borderRadius: 8,
    background: "#101827",
    color: "var(--color-surface-subtle)",
    padding: 10,
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: 12,
    lineHeight: "18px",
  },
  compareModalLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 100003,
    display: "grid",
    placeItems: "center",
    padding: 18,
    boxSizing: "border-box",
  },
  compareModalCard: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateRows: "auto auto auto minmax(0, 1fr) auto auto",
    gap: 12,
    width: "min(1280px, 100%)",
    maxHeight: "calc(100dvh - 36px)",
    overflow: "hidden",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 8,
    background: "var(--color-white)",
    boxShadow: "0 24px 70px rgba(8, 15, 29, 0.26)",
  },
  compareModalHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 38px",
    alignItems: "start",
    gap: 14,
    padding: "18px 18px 0",

    "& span": {
      color: "var(--color-primary-dark)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& h2": {
      margin: "3px 0 0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "var(--color-text-primary)",
      fontSize: 22,
      lineHeight: "28px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& button": {
      display: "grid",
      placeItems: "center",
      width: 38,
      height: 38,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-white)",
      color: "var(--color-text-muted)",
      cursor: "pointer",
    },
  },
  compareBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    padding: "0 18px",

    "& span, & strong": {
      borderRadius: 8,
      background: "#F4F7FA",
      color: "var(--color-text-secondary)",
      padding: "5px 8px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
    },

    "& strong": {
      background: "#FFF6E6",
      color: "#94651B",
    },
  },
  compareDiffSummary: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    padding: "0 18px 4px",

    "& span": {
      border: "1px solid var(--color-border-subtle)",
      borderRadius: 8,
      background: "var(--color-surface-raised)",
      color: "var(--color-text-secondary)",
      padding: "5px 8px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
    },
  },
  compareColumns: {
    minHeight: 0,
    overflow: "auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 12,
    padding: "0 18px 2px",

    "@media (max-width: 980px)": {
      gridTemplateColumns: "1fr",
    },
  },
  compareColumn: {
    minWidth: 0,
    display: "grid",
    alignContent: "start",
    gap: 10,
    border: "1px solid var(--color-border-subtle)",
    borderRadius: 8,
    background: "var(--color-surface-raised)",
    padding: 10,
  },
  compareColumnHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,

    "& h3": {
      margin: 0,
      color: "var(--color-text-primary)",
      fontSize: 16,
      lineHeight: "22px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& span": {
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-regular)",
    },
  },
  compareSection: {
    minWidth: 0,
    display: "grid",
    gap: 8,

    "& h4": {
      margin: 0,
      color: "var(--color-text-secondary)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
    },

    "& p": {
      margin: 0,
      color: "var(--color-text-muted)",
      fontSize: 12,
      lineHeight: "18px",
    },
  },
  compareSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 7,

    "& span": {
      minWidth: 0,
      border: "1px solid var(--color-border-subtle)",
      borderRadius: 8,
      background: "var(--color-white)",
      padding: "8px 9px",
    },

    "& small": {
      display: "block",
      color: "var(--color-text-muted)",
      fontSize: 10,
      lineHeight: "13px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& strong": {
      display: "block",
      marginTop: 4,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "var(--color-text-primary)",
      fontSize: 13,
      lineHeight: "18px",
      fontWeight: "var(--font-weight-semibold)",
    },
  },
  compareTableWrap: {
    maxWidth: "100%",
    overflow: "auto",
    border: "1px solid var(--color-border-subtle)",
    borderRadius: 8,
    background: "var(--color-white)",
  },
  compareTable: {
    width: "100%",
    minWidth: 760,
    borderCollapse: "collapse",

    "& th, & td": {
      borderBottom: "1px solid var(--color-border-subtle)",
      padding: "7px 8px",
      textAlign: "left",
      verticalAlign: "top",
      color: "var(--color-text-secondary)",
      fontSize: 12,
      lineHeight: "17px",
      fontWeight: "var(--font-weight-regular)",
      overflowWrap: "anywhere",
    },

    "& th": {
      background: "#F7FAFC",
      color: "var(--color-text-muted)",
      fontSize: 10,
      lineHeight: "13px",
      fontWeight: "var(--font-weight-semibold)",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },

    "& tr:last-child td": {
      borderBottom: "none",
    },

    "& input": {
      width: "100%",
      minWidth: 90,
      border: "1px solid var(--color-border)",
      borderRadius: 6,
      outline: "none",
      background: "var(--color-white)",
      color: "var(--color-text-primary)",
      padding: "5px 6px",
      fontSize: 12,
      lineHeight: "16px",
      boxSizing: "border-box",

      "&:focus": {
        borderColor: "var(--color-primary)",
      },
    },
  },
  compareDiffBadge: {
    display: "inline-flex",
    borderRadius: 8,
    background: "#EEF2F7",
    color: "var(--color-text-secondary)",
    padding: "3px 7px",
    fontSize: 11,
    lineHeight: "14px",
    fontWeight: "var(--font-weight-medium)",
    textTransform: "capitalize",
  },
  compareDiffAdded: {
    background: "#E8F8F0",
    color: "#08794F",
  },
  compareDiffChanged: {
    background: "#FFF6E6",
    color: "#94651B",
  },
  compareDiffRemoved: {
    background: "#FDECEC",
    color: "#A83F3F",
  },
  compareDiffUnchanged: {
    background: "#EEF2F7",
    color: "var(--color-text-muted)",
  },
  compareMetaGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr)",
    gap: 12,
    padding: "0 18px",
    maxHeight: 260,
    overflow: "auto",

    "@media (max-width: 980px)": {
      gridTemplateColumns: "1fr",
    },
  },
  compareIssueList: {
    display: "grid",
    gap: 7,

    "& span": {
      display: "grid",
      gap: 3,
      border: "1px solid var(--color-border-subtle)",
      borderRadius: 8,
      background: "var(--color-surface-raised)",
      color: "var(--color-text-secondary)",
      padding: "8px 9px",
      fontSize: 12,
      lineHeight: "17px",
      overflowWrap: "anywhere",
    },

    "& strong": {
      color: "var(--color-text-primary)",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-semibold)",
    },

    "& small": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "14px",
    },
  },
  compareNote: {
    display: "grid",
    gap: 6,
    padding: "0 18px",

    "& span": {
      color: "var(--color-text-muted)",
      fontSize: 11,
      lineHeight: "14px",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
    },

    "& textarea": {
      width: "100%",
      minHeight: 52,
      maxHeight: 94,
      resize: "vertical",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      outline: "none",
      color: "var(--color-text-primary)",
      padding: "8px 10px",
      fontSize: 13,
      lineHeight: "18px",
      boxSizing: "border-box",
    },
  },
  compareModalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 9,
    padding: "0 18px 18px",

    "& button": {
      minHeight: 36,
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 13,
      lineHeight: "16px",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",

      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
  },
});
