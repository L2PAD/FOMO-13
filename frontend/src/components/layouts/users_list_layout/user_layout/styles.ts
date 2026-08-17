import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    pageWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 24,
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px 24px',
        gap: 24,
        background: 'var(--color-white)',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '2px 2px 0 #EEEEEE',
        borderRadius: 8,
    },
    userDataWrapper: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,

        '& img': {
            width: 120,
            height: 120,
            objectFit: 'cover',
            borderRadius: '100%',
            flexShrink: 0,
        },
    },
    userName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '32px',
        lineHeight: '39px',
        marginBottom: '2px !important',
        wordBreak: 'break-word',
    },
    userMeta: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        lineHeight: '18px',
        marginBottom: 6,
        wordBreak: 'break-word',
    },
    onlineStatus: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        minHeight: 26,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'var(--color-surface-muted)',
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '13px',
        lineHeight: '16px',
        marginBottom: 10,
        width: 'fit-content',
        textTransform: 'capitalize',
    },
    onlineStatusActive: {
        background: '#EAF9F0',
        color: '#0D7A3B',
    },
    onlineStatusDot: {
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: '#A8B3C2',
        boxShadow: '0 0 0 3px rgba(168, 179, 194, 0.18)',

        '$onlineStatusActive &': {
            background: '#16A34A',
            boxShadow: '0 0 0 4px rgba(22, 163, 74, 0.18)',
        },
    },
    userDescriptionWrapper: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'center',
        marginBottom:'10px'
    },
    walletKeyWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',
        minHeight: 32,
    },
    headerDataWrapper: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: 24,
        flexWrap: 'wrap',

        '& > div': {
            minWidth: 82,
        },
    },
    dataName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
        marginBottom: 4,
        wordBreak: 'break-word',
    },
    dataTitle: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 24,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 16,
        padding: '0 24px',

        '@media (max-width: 1180px)': {
            gridTemplateColumns: '1fr',
        },
    },
    detailsCard: {
        background: 'var(--color-white)',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '2px 2px 0 #EEEEEE',
        borderRadius: 8,
        padding: 16,
        minWidth: 0,
    },
    detailsTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        margin: '0 0 12px',
    },
    detailsList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px 18px',

        '@media (max-width: 720px)': {
            gridTemplateColumns: '1fr',
        },
    },
    detailsRow: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    detailLabel: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-medium)",
        fontSize: '13px',
        lineHeight: '16px',
    },
    detailValue: {
        color: 'var(--color-text-strong)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '24px',
        wordBreak: 'break-word',
    },
    detailCopyButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        width: 'fit-content',
        maxWidth: '100%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-strong)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '24px',
        cursor: 'pointer',
        textAlign: 'left',

        '& span': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
        },

        '& svg': {
            flexShrink: 0,
        },
    },
})
