import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    summary: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 23px 12px',
        color: 'var(--color-text-muted)',
        fontSize: 13,
        '& strong': {
            color: 'var(--color-text-strong)',
        }
    },
    wrapper: {
        background: '#F8F8F9',
    },
    table: {
        paddingBottom: 20,
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 23px',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '12px',
        lineHeight: '14px',
        color: 'var(--color-text-muted)',
    },
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 72,
        padding: '12px 23px',
        borderBottom: '1px solid #EEF1F5',
        background: 'var(--color-white)',
        color: 'var(--color-text-strong)',
        fontSize: 14,
    },
    projectCell: {
        width: 330,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
    },
    projectImage: {
        width: 36,
        height: 36,
        borderRadius: 8,
        objectFit: 'cover',
        background: '#F3F4F6',
        flexShrink: 0,
    },
    projectTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: "var(--font-weight-semibold)",
        lineHeight: '18px',
        minWidth: 0,
        '& > span.hot': {
            background: '#FEF2F2',
            color: '#B91C1C',
        },
        '& > span.warm': {
            background: '#FFF7ED',
            color: '#C2410C',
        },
        '& > span.cold': {
            background: '#EFF6FF',
            color: '#1D4ED8',
        },
    },
    projectDescription: {
        color: 'var(--color-text-muted)',
        fontSize: 12,
        lineHeight: '18px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: 250,
    },
    tierBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        height: 22,
        padding: '0 8px',
        borderRadius: 8,
        background: '#F3F4F6',
        color: '#4B5563',
        fontSize: 11,
        fontWeight: "var(--font-weight-semibold)",
    },
    rankCell: {
        width: 90,
    },
    priceCell: {
        width: 130,
        '& span': {
            display: 'block',
            marginTop: 3,
            fontSize: 12,
        }
    },
    metricCell: {
        width: 150,
    },
    historyCell: {
        width: 170,
        '& span': {
            display: 'block',
            marginTop: 3,
        }
    },
    statusCell: {
        width: 190,
        '& span': {
            display: 'block',
            marginTop: 3,
        }
    },
    flagsCell: {
        width: 150,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
    },
    actionsCell: {
        width: 220,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        '& button': {
            height: 30,
            padding: '0 10px',
            border: '1px solid #D9E0EA',
            borderRadius: 6,
            background: 'var(--color-white)',
            color: 'var(--color-info)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: 12,
            cursor: 'pointer',
        },
        '& button:disabled': {
            cursor: 'default',
            opacity: 0.55,
        },
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        padding: '0 8px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: "var(--font-weight-semibold)",
        '&.sponsored': {
            color: '#155EEF',
            background: '#EEF4FF',
        },
        '&.eralash': {
            color: '#A15C00',
            background: '#FFF4D6',
        },
    },
    muted: {
        color: 'var(--color-text-muted)',
        fontSize: 12,
    },
    positive: {
        color: '#059669',
    },
    negative: {
        color: '#DC2626',
    },
    showMoreButton:{
        background:'white',
        width:'100%',
        padding:'10px 12px',
        border:'none',
        margin:'20px auto',
        color: 'var(--color-info)',
        fontWeight: "var(--font-weight-semibold)",
        cursor: 'pointer',
    },
    emptyState: {
        margin: 23,
        padding: 20,
        borderRadius: 8,
        background: '#F8F8F9',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
    },
})
