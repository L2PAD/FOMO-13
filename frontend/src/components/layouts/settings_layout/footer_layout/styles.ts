import { createUseStyles } from 'react-jss';

export const useStyles = createUseStyles({
  page: {
    width: 'calc(100% - 48px)',
    maxWidth: 1366,
    margin: '24px auto 64px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,

    '@media (max-width: 720px)': {
      width: 'calc(100% - 24px)',
      marginTop: 16,
    },
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    padding: '25px 28px',
    overflow: 'hidden',
    borderRadius: 20,
    background: 'linear-gradient(120deg, #071b21 0%, #063b34 58%, #057f69 100%)',
    boxShadow: '0 22px 48px rgba(7, 27, 33, 0.16)',

    '& *': {
      color: 'var(--color-white)',
    },

    '@media (max-width: 720px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      padding: 22,
      borderRadius: 16,
    },
  },
  eyebrow: {
    marginBottom: 7,
    color: '#8ff4d8 !important',
    fontSize: 11,
    lineHeight: '15px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 31,
    lineHeight: '37px',
    letterSpacing: '-0.02em',
  },
  heroDescription: {
    maxWidth: 720,
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.74) !important',
    fontSize: 14,
    lineHeight: '21px',
  },
  syncBadge: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.1)',
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 600,
  },
  syncBadgeDirty: {
    background: 'rgba(255, 199, 2, 0.14)',
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#67e8b8',
    boxShadow: '0 0 0 4px rgba(103, 232, 184, 0.14)',
  },
  snapshotNotice: {
    padding: '12px 14px',
    border: '1px solid rgba(32, 130, 234, 0.16)',
    borderRadius: 12,
    background: 'var(--color-info-soft)',
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    lineHeight: '19px',

    '& strong': {
      color: 'var(--color-info)',
    },
  },
  panel: {
    overflow: 'hidden',
    border: '1px solid rgba(83, 98, 124, 0.13)',
    borderRadius: 18,
    background: 'var(--color-white)',
    boxShadow: '0 14px 36px rgba(7, 11, 53, 0.055)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: '20px 22px',
    borderBottom: '1px solid var(--color-border-subtle)',
    background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(255, 255, 255, 0.9))',

    '@media (max-width: 600px)': {
      flexDirection: 'column',
      padding: 18,
    },
  },
  panelTitle: {
    fontSize: 19,
    lineHeight: '24px',
  },
  panelDescription: {
    maxWidth: 780,
    marginTop: 5,
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    lineHeight: '20px',
  },
  panelPill: {
    flexShrink: 0,
    display: 'inline-flex',
    padding: '5px 9px',
    borderRadius: 999,
    background: 'var(--color-surface-muted)',
    color: 'var(--color-text-muted)',
    fontSize: 11,
    lineHeight: '14px',
    fontWeight: 700,
  },
  panelPillDirty: {
    background: 'var(--color-warning-soft)',
    color: 'var(--color-warning-dark)',
  },
  legalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    padding: 20,

    '@media (max-width: 820px)': {
      gridTemplateColumns: '1fr',
      padding: 14,
    },
  },
  legalCard: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 13,
    padding: 17,
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    background: 'var(--color-white)',
    transition: 'border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease',

    '&:hover': {
      borderColor: 'rgba(4, 165, 132, 0.28)',
      boxShadow: '0 12px 26px rgba(7, 11, 53, 0.07)',
      transform: 'translateY(-1px)',
    },
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  documentIcon: {
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-dark)',
    fontSize: 17,
    fontWeight: 700,
  },
  contentStatus: {
    padding: '5px 8px',
    borderRadius: 999,
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-dark)',
    fontSize: 11,
    lineHeight: '14px',
    fontWeight: 700,
  },
  emptyStatus: {
    background: 'var(--color-warning-soft)',
    color: 'var(--color-warning-dark)',
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: '22px',
  },
  cardDescription: {
    marginTop: 4,
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    lineHeight: '18px',
  },
  excerpt: {
    minHeight: 40,
    color: 'var(--color-text-muted)',
    fontSize: 13,
    lineHeight: '20px',
  },
  emptyExcerpt: {
    fontStyle: 'italic',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid var(--color-border-subtle)',

    '@media (max-width: 480px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
  cardMeta: {
    color: 'var(--color-text-soft)',
    fontSize: 11,
    lineHeight: '15px',
  },
  editButton: {
    minWidth: 86,
    padding: '9px 12px !important',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '17px 15px',
    padding: 22,

    '@media (max-width: 980px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 620px)': {
      gridTemplateColumns: '1fr',
      padding: 16,
    },
  },
  appsBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    padding: '20px 22px 6px',

    '@media (max-width: 620px)': {
      padding: '16px 16px 6px',
    },
  },
  appsGroup: {
    minWidth: 0,
  },
  groupTitle: {
    margin: '0 0 12px',
    color: 'var(--color-text-muted)',
    fontSize: 11.5,
    lineHeight: '15px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '17px 15px',

    '@media (max-width: 980px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 620px)': {
      gridTemplateColumns: '1fr',
    },
  },
  hint: {
    display: 'block',
    marginTop: 5,
    color: 'var(--color-text-soft)',
    fontSize: 11.5,
    lineHeight: '15px',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  },
  inputWrapper: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    color: 'var(--color-text-strong)',
    fontSize: 13,
    lineHeight: '17px',
    fontWeight: 700,
  },
  input: {
    width: '100%',
    minHeight: 42,
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    background: 'var(--color-white)',
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
  saveBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    margin: '0 22px 20px',
    padding: '12px 14px',
    border: '1px solid rgba(4, 165, 132, 0.2)',
    borderRadius: 13,
    background: 'rgba(249, 255, 253, 0.96)',

    '@media (max-width: 680px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
      margin: '0 16px 16px',
    },
  },
  dirtyText: {
    color: 'var(--color-primary-dark)',
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 700,
  },
  savedText: {
    color: 'var(--color-text-muted)',
    fontSize: 13,
    lineHeight: '18px',
  },
  actions: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,

    '@media (max-width: 460px)': {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    },
  },
  saveButton: {
    minWidth: 148,
  },
});
