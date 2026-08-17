import { createUseStyles } from 'react-jss';

export const useStyles = createUseStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingTop: 12,
  },
  intro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,

    '@media (max-width: 680px)': {
      flexDirection: 'column',
      gap: 9,
    },
  },
  description: {
    maxWidth: 760,
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    lineHeight: '20px',
  },
  status: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '5px 9px',
    borderRadius: 999,
    background: 'var(--color-warning-soft)',
    color: 'var(--color-warning-dark)',
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 'var(--font-weight-semibold)',
  },
  statusClean: {
    background: 'var(--color-surface-muted)',
    color: 'var(--color-text-muted)',
  },
  actionBar: {
    position: 'sticky',
    bottom: -16,
    zIndex: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    margin: '0 -16px -16px',
    padding: '13px 16px',
    borderTop: '1px solid var(--color-border-subtle)',
    background: 'rgba(255, 255, 255, 0.96)',
    boxShadow: '0 -12px 28px rgba(7, 11, 53, 0.05)',
    backdropFilter: 'blur(12px)',

    '@media (max-width: 760px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
      gap: 10,
    },
  },
  actionHint: {
    color: 'var(--color-text-muted)',
    fontSize: 12,
    lineHeight: '17px',
  },
  limitError: {
    color: 'var(--color-danger-dark)',
    fontSize: 12,
    lineHeight: '17px',
    fontWeight: 'var(--font-weight-semibold)',
  },
  actions: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,

    '& button': {
      minWidth: 108,
    },

    '@media (max-width: 520px)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',

      '& button': {
        minWidth: 0,
        paddingLeft: 7,
        paddingRight: 7,
      },
    },
  },
  saveButton: {
    minWidth: '150px !important',

    '@media (max-width: 520px)': {
      minWidth: '0 !important',
    },
  },
});
