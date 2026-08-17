import { createUseStyles } from 'react-jss'

export const useStyles = createUseStyles({
  wrapper: {
    marginTop: '12px',
    background: '#F8F8F9',
  },
  headerWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 23px',
    fontWeight: "var(--font-weight-regular)",
    fontSize: '12px',
    lineHeight: '14px',
    gap: '8px',
    color: 'var(--color-text-muted)',
  },
  projectsCell: {
    width: 400,
  },
  dateWrapper: {
    width: 120,
  },
  investorsCell: {
    width: 200,
  },
  raisedCell: {
    width: 92,
  },
  fundingCell: {
    width: 110,
  },
  typeCell: {
    width: 400,
  },
  flagsCell: {
    width: 246,
  },
  actionsCell: {
    width: 60,
  },
  creatingModalWrapper: {
    '& div': {
      opacity: (props: boolean) => (props ? '1' : '0'),
      visibility: (props: boolean) => (props ? 'visible' : 'hidden'),
    },

    '& .creating_project_modal': {
      zIndex: 99999,
      position: 'absolute',
      top: '20%',
      left: '40.6%',
      opacity: (props: boolean) => (props ? '1' : '0'),
      visibility: (props: boolean) => (props ? 'visible' : 'hidden'),
      transition: 'all 0.4s ease',
    },
  },
})
