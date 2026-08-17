import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    rowWrapper: {
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10,
        boxShadow: '4px 4px 0px #EEEEEE',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        borderRadius: 8,

        '& > div': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        },
    },
    assetWrapper: {
        width: 134,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    tokenWrapper: {
        width: 143,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
            color: 'var(--color-text-muted)',
        },
    },
    publicWrapper: {
        width: 143,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
            color: 'var(--color-text-muted)',
        },
    },
    seedWrapper: {
        width: 143,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
            color: 'var(--color-text-muted)',
        },
    },
    privateWrapper: {
        width: 143,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
            color: 'var(--color-text-muted)',
        },
    },
    strategicWrapper: {
        width: 143,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
            color: 'var(--color-text-muted)',
        },
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
    imageStyle: {
        borderRadius: 100,
    },
})