import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    headerWrapper: {
        display: 'flex',
        padding: '8px 16px',

        '& > div': {
            color: 'var(--color-text-muted)',
            fontWeight: "var(--font-weight-regular)",
            fontSize: '12px',
            lineHeight: '14px',
        }
    },
    assetWrapper: {
        width: 134,
    },
    tokenWrapper: {
        width: 143,
    },
    publicWrapper: {
        width: 143,
    },
    seedWrapper: {
        width: 143,
    },
    privateWrapper: {
        width: 143,
    },
    strategicWrapper: {
        width: 143,
    },
    stageWrapper: {
        width: 138,
    },
    upcomingWrapper: {
        width: 102,
    },
    lastWrapper: {
        width: 'max-content',
    },
})