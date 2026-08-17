import { createUseStyles } from 'react-jss'

export const useInfoStyles = createUseStyles({
  page: {
    minHeight: 'calc(100vh - 92px)',
    padding: '26px 24px 64px',
    background:
      'radial-gradient(circle at 92% 4%, rgba(4, 165, 132, 0.10), transparent 28%), linear-gradient(180deg, #f8fbfa 0%, #f5f7fb 100%)',

    '@media (max-width: 720px)': {
      padding: '18px 12px 48px',
    },
  },
  hero: {
    position: 'relative',
    maxWidth: 1540,
    margin: '0 auto 20px',
    overflow: 'hidden',
    padding: '30px 32px',
    color: '#fff',
    borderRadius: 24,
    background:
      'linear-gradient(120deg, #071b21 0%, #063b34 55%, #057f69 100%)',
    boxShadow: '0 26px 60px rgba(7, 27, 33, 0.18)',

    '& *': {
      color: 'inherit',
    },

    '@media (max-width: 720px)': {
      padding: '24px 20px',
      borderRadius: 18,
    },
  },
  heroGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    top: -220,
    right: -90,
    borderRadius: '50%',
    background: 'rgba(109, 255, 215, 0.16)',
    filter: 'blur(2px)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,

    '@media (max-width: 820px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    color: '#8ff4d8',
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  heroTitle: {
    maxWidth: 720,
    fontSize: 34,
    lineHeight: '40px',
    letterSpacing: '-0.02em',

    '@media (max-width: 720px)': {
      fontSize: 28,
      lineHeight: '34px',
    },
  },
  heroDescription: {
    maxWidth: 760,
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 15,
    lineHeight: '22px',
  },
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,

    '@media (max-width: 820px)': {
      justifyContent: 'flex-start',
    },
  },
  statusChip: {
    minHeight: 36,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.10)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#67e8b8',
    boxShadow: '0 0 0 4px rgba(103, 232, 184, 0.14)',
  },
  workspace: {
    maxWidth: 1540,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '250px minmax(0, 1fr)',
    alignItems: 'start',
    gap: 20,

    '@media (max-width: 1040px)': {
      gridTemplateColumns: '1fr',
    },
  },
  sidebar: {
    position: 'sticky',
    top: 96,
    maxHeight: 'calc(100vh - 116px)',
    overflowY: 'auto',
    padding: 14,
    border: '1px solid rgba(83, 98, 124, 0.13)',
    borderRadius: 18,
    background: 'rgba(255, 255, 255, 0.92)',
    boxShadow: '0 12px 32px rgba(7, 11, 53, 0.06)',
    scrollbarWidth: 'thin',

    '@media (max-width: 1040px)': {
      top: 86,
      zIndex: 30,
      maxHeight: 'none',
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: 10,
    },
  },
  navGroup: {
    '& + &': {
      marginTop: 18,
    },

    '@media (max-width: 1040px)': {
      display: 'contents',
    },
  },
  navGroupTitle: {
    padding: '0 9px 7px',
    color: 'var(--color-text-muted)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',

    '@media (max-width: 1040px)': {
      display: 'none',
    },
  },
  navButton: {
    width: '100%',
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '9px 10px',
    border: '1px solid transparent',
    borderRadius: 10,
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: 600,
    textAlign: 'left',
    transition: 'all 0.16s ease',

    '&:hover': {
      color: 'var(--color-text-primary)',
      background: 'var(--color-surface-subtle)',
    },

    '&:focus-visible': {
      borderColor: 'var(--color-primary)',
      boxShadow: '0 0 0 3px var(--color-primary-soft-strong)',
    },

    '@media (max-width: 1040px)': {
      width: 'auto',
      flex: '0 0 auto',
      whiteSpace: 'nowrap',
    },
  },
  navButtonActive: {
    color: 'var(--color-primary-dark)',
    background: 'var(--color-primary-soft)',
    borderColor: 'rgba(4, 165, 132, 0.20)',
  },
  content: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  sectionIntro: {
    padding: '2px 2px 4px',
  },
  sectionTitle: {
    color: 'var(--color-text-primary)',
    fontSize: 28,
    lineHeight: '34px',
    letterSpacing: '-0.015em',
  },
  sectionDescription: {
    maxWidth: 820,
    marginTop: 7,
    color: 'var(--color-text-secondary)',
    fontSize: 15,
    lineHeight: '22px',
  },
  panel: {
    overflow: 'hidden',
    border: '1px solid rgba(83, 98, 124, 0.13)',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 14px 36px rgba(7, 11, 53, 0.055)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    padding: '20px 22px',
    borderBottom: '1px solid var(--color-border-subtle)',
    background:
      'linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(255,255,255,0.9))',

    '@media (max-width: 720px)': {
      flexDirection: 'column',
      padding: '18px',
    },
  },
  panelTitle: {
    fontSize: 19,
    lineHeight: '24px',
  },
  panelDescription: {
    maxWidth: 760,
    marginTop: 5,
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    lineHeight: '20px',
  },
  panelBody: {
    padding: 22,

    '@media (max-width: 720px)': {
      padding: 16,
    },
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px 16px',

    '@media (max-width: 760px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  field: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: 'var(--color-text-strong)',
    fontSize: 13,
    lineHeight: '17px',
    fontWeight: 700,
  },
  required: {
    color: 'var(--color-danger)',
  },
  help: {
    color: 'var(--color-text-muted)',
    fontSize: 12,
    lineHeight: '17px',
  },
  input: {
    width: '100%',
    minHeight: 42,
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    background: '#fff',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    lineHeight: '20px',
    transition: 'border-color 0.16s ease, box-shadow 0.16s ease',

    '&::placeholder': {
      color: 'var(--color-text-soft)',
    },

    '&:focus': {
      borderColor: 'var(--color-primary)',
      boxShadow: '0 0 0 3px var(--color-primary-soft)',
    },

    '&:disabled': {
      cursor: 'not-allowed',
      background: 'var(--color-surface-muted)',
    },
  },
  textarea: {
    resize: 'vertical',
    minHeight: 104,
  },
  checkboxRow: {
    minHeight: 42,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    background: 'var(--color-surface-raised)',
    fontSize: 14,
    fontWeight: 600,

    '& input': {
      width: 18,
      height: 18,
      accentColor: 'var(--color-primary)',
    },
  },
  listBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 14,
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 14,
    background: 'var(--color-surface-subtle)',
  },
  listHeading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  nestedItem: {
    padding: 15,
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    background: '#fff',
  },
  nestedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  nestedTitle: {
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    fontWeight: 700,
  },
  button: {
    minHeight: 40,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '9px 14px',
    border: '1px solid transparent',
    borderRadius: 10,
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 700,
    transition: 'all 0.16s ease',

    '&:hover:not(:disabled)': {
      background: 'var(--color-primary-hover)',
      transform: 'translateY(-1px)',
    },

    '&:focus-visible': {
      boxShadow: '0 0 0 3px var(--color-primary-soft-strong)',
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.55,
      transform: 'none',
    },
  },
  buttonSecondary: {
    borderColor: 'var(--color-border)',
    background: '#fff',
    color: 'var(--color-text-secondary)',

    '&:hover:not(:disabled)': {
      background: 'var(--color-surface-subtle)',
      color: 'var(--color-text-primary)',
    },
  },
  buttonDanger: {
    borderColor: 'rgba(255, 88, 88, 0.20)',
    background: 'var(--color-danger-soft)',
    color: 'var(--color-danger-dark)',

    '&:hover:not(:disabled)': {
      background: 'rgba(255, 88, 88, 0.14)',
    },
  },
  buttonGhostOnDark: {
    minHeight: 36,
    padding: '8px 12px',
    borderColor: 'rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',

    '&:hover:not(:disabled)': {
      background: 'rgba(255,255,255,0.15)',
    },
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  saveBar: {
    position: 'sticky',
    bottom: 12,
    zIndex: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    margin: '18px 22px 20px',
    padding: '12px 14px',
    border: '1px solid rgba(4, 165, 132, 0.20)',
    borderRadius: 13,
    background: 'rgba(249, 255, 253, 0.96)',
    boxShadow: '0 12px 32px rgba(7, 27, 33, 0.12)',
    backdropFilter: 'blur(12px)',

    '@media (max-width: 720px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      margin: '14px 16px 16px',
    },
  },
  dirtyText: {
    color: 'var(--color-primary-dark)',
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 700,
  },
  mutedText: {
    color: 'var(--color-text-muted)',
    fontSize: 13,
    lineHeight: '19px',
  },
  stateBox: {
    minHeight: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 28,
    textAlign: 'center',
  },
  spinner: {
    width: 30,
    height: 30,
    border: '3px solid rgba(4, 165, 132, 0.18)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: '$spin 0.8s linear infinite',
  },
  errorTitle: {
    color: 'var(--color-danger-dark)',
    fontSize: 17,
    lineHeight: '22px',
  },
  alert: {
    padding: '11px 13px',
    border: '1px solid rgba(255, 88, 88, 0.22)',
    borderRadius: 10,
    background: 'var(--color-danger-soft)',
    color: 'var(--color-danger-dark)',
    fontSize: 13,
    lineHeight: '18px',
  },
  collectionToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '16px 22px',
    borderBottom: '1px solid var(--color-border-subtle)',

    '@media (max-width: 640px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      padding: 16,
    },
  },
  collectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    padding: 18,

    '@media (max-width: 760px)': {
      gridTemplateColumns: '1fr',
      padding: 14,
    },
  },
  itemCard: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 13,
    padding: 16,
    border: '1px solid var(--color-border)',
    borderRadius: 13,
    background: '#fff',
    transition: 'border-color 0.16s ease, box-shadow 0.16s ease',

    '&:hover': {
      borderColor: 'rgba(4, 165, 132, 0.28)',
      boxShadow: '0 10px 24px rgba(7, 11, 53, 0.06)',
    },
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemTitle: {
    overflow: 'hidden',
    fontSize: 15,
    lineHeight: '20px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    marginTop: 3,
    color: 'var(--color-text-muted)',
    fontSize: 12,
    lineHeight: '16px',
  },
  itemActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
  },
  compactButton: {
    minHeight: 32,
    padding: '6px 9px',
    borderRadius: 8,
    fontSize: 12,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 8px',
    borderRadius: 999,
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-dark)',
    fontSize: 11,
    lineHeight: '14px',
    fontWeight: 700,
  },
  pillInactive: {
    background: 'var(--color-surface-muted)',
    color: 'var(--color-text-muted)',
  },
  editorDrawer: {
    borderTop: '1px solid var(--color-border-subtle)',
    background: 'linear-gradient(180deg, #fbfdfc, #fff)',
  },
  editorDrawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '18px 22px 0',
  },
  editorDrawerBody: {
    padding: 20,

    '@media (max-width: 720px)': {
      padding: 16,
    },
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'rgba(7, 11, 53, 0.44)',
    backdropFilter: 'blur(5px)',
  },
  modal: {
    width: '100%',
    maxWidth: 480,
    padding: 22,
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 30px 80px rgba(7, 11, 53, 0.24)',
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: '25px',
  },
  modalDescription: {
    margin: '8px 0 20px',
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    lineHeight: '20px',
  },
  imageField: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 152px',
    gap: 12,

    '@media (max-width: 620px)': {
      gridTemplateColumns: '1fr',
    },
  },
  imageControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  imagePreview: {
    position: 'relative',
    minHeight: 118,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed var(--color-border)',
    borderRadius: 11,
    background:
      'linear-gradient(45deg, #f5f7fa 25%, transparent 25%), linear-gradient(-45deg, #f5f7fa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f7fa 75%), linear-gradient(-45deg, transparent 75%, #f5f7fa 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',

    '& img': {
      width: '100%',
      height: 118,
      display: 'block',
      objectFit: 'contain',
      background: 'rgba(255,255,255,0.82)',
    },
  },
  uploadLabel: {
    position: 'relative',
    overflow: 'hidden',

    '& input': {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
      pointerEvents: 'none',
    },
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 13,

    '@media (max-width: 1120px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  overviewCard: {
    minHeight: 130,
    padding: 18,
    border: '1px solid rgba(83, 98, 124, 0.13)',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 10px 28px rgba(7, 11, 53, 0.05)',
  },
  overviewLabel: {
    color: 'var(--color-text-muted)',
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },
  overviewValue: {
    marginTop: 10,
    fontSize: 28,
    lineHeight: '32px',
    letterSpacing: '-0.02em',
  },
  overviewHint: {
    marginTop: 7,
    color: 'var(--color-text-secondary)',
    fontSize: 12,
    lineHeight: '17px',
  },
  resourceList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,

    '@media (max-width: 940px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 560px)': {
      gridTemplateColumns: '1fr',
    },
  },
  resourceButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '13px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: 11,
    background: '#fff',
    textAlign: 'left',

    '&:hover': {
      borderColor: 'rgba(4, 165, 132, 0.32)',
      background: 'var(--color-primary-soft)',
    },
  },
  analyticsControls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',

    '& th, & td': {
      padding: '11px 12px',
      borderBottom: '1px solid var(--color-border-subtle)',
      fontSize: 13,
      textAlign: 'left',
    },

    '& th': {
      color: 'var(--color-text-muted)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
  '@keyframes spin': {
    to: {
      transform: 'rotate(360deg)',
    },
  },
})
