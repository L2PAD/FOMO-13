import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    editWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-info)',
        marginBottom: 8,

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    newsRowWrapper: {
        position:'relative',
        display: 'flex',
        width: '100%',
        overflowX: 'auto',
        gap: 16,
        paddingBottom: 20,
        marginBottom: 24,
    },
    addRoundWrapper:{
        position:'absolute',
        top:'0px',
        right:'0px'
    },
    removeItem:{
        position:'absolute',
        top:'10px',
        right:'10px',
        border:'0px',
        background:'transparent',
    },
    newsWrapper: {
        position:'relative',
        minWidth: 360,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        padding: 16,
    },
    newsTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        marginBottom: 10,
    },
    contentRow: {
        display: 'flex',
        marginBottom: 12,

        '& > div': {
            width: '50%',
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
            color: 'var(--color-text-muted)',

            '& > span': {
                fontWeight: "var(--font-weight-semibold)",
                fontSize: '14px',
                lineHeight: '17px',
            }
        }
    },
    contentWrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    titleWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        color: 'var(--color-text-muted)',
        marginBottom: 16,

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    chartWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 24,
    },
    colorCircle: {
        width: 12,
        height: 12,
        borderRadius: 100,
    },
    totalsRow: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',
        display: 'flex',
        gap: 12,
        marginBottom: 13,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        },
    },
    dataRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        },

        '&:first-child': {
            marginTop: 24,
        },
        '&:not(:last-child)': {
            marginBottom: 13,
        }
    },
    metricsWrapper: {
        display: 'flex',
        gap: 72,
    },
    metricRow: {
        display: 'flex',
        gap: 22,
        marginBottom: 13,

        '& > div:first-child': {
            width: 140,
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            gap: 6,
            alignItems: 'center',

            '& svg': {
                width: 16,

                '& path': {
                    fill: 'var(--color-info)'
                },
            }
        },
        '& > div:last-child': {
            width: '58%',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        }
    },
    longMetricRow: {
        display: 'flex',
        gap: 22,
        marginBottom: 13,

        '& > div:first-child': {
            width: 180,
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            gap: 6,
            alignItems: 'center',

            '& svg': {
                width: 16,

                '& path': {
                    fill: 'var(--color-info)'
                },
            }
        },
        '& > div:last-child': {
            width: 80,
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        }
    },
})