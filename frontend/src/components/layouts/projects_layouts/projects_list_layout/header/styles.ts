import {createUseStyles} from 'react-jss';

interface IProps {
    isCreatingModal:boolean
} 

export const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 23px 10px'
    },
    leftWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    rightWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    mainTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '40px',
        lineHeight: '48px',
    },
    searchWrapper: {
        position: 'relative',

        '& > svg': {
            position: 'absolute',
            bottom: 5,
            left: 12,
        }
    },
    searchInput: {
        border: 'none',
        background: '#F8F8F9',
        borderRadius: 8,
        padding: '8px 12px 8px 35px',
        width: 345,

        '&::placeholder': {
            marginTop: 10,
            color: 'rgba(115, 128, 148, 0.5)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '16px',
            lineHeight: '19px',
        }
    },
    creatingModalWrapper: {
        opacity: ({isCreatingModal} : IProps) => isCreatingModal ? '1' : '0',
        visibility: ({isCreatingModal} : IProps) => isCreatingModal ? 'visible' : 'hidden',
        '& .creating_project_modal': {
            zIndex: 99999,
            position: 'absolute',
            top: '20%',
            left: '40.6%',
            opacity: ({isCreatingModal} : IProps) => isCreatingModal ? '1' : '0',
            transition:'opacity 0.4s ease',
        }
    },
    importPanel: {
        position: 'absolute',
        right: 23,
        top: 74,
        zIndex: 50,
        width: 520,
        maxWidth: 'calc(100vw - 46px)',
        background: 'var(--color-white)',
        border: '1px solid #E8ECF2',
        borderRadius: 8,
        boxShadow: '0 18px 48px rgba(17, 24, 39, 0.12)',
        padding: 18,
    },
    importPanelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 14,
    },
    importPanelTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: 18,
        lineHeight: '22px',
        color: 'var(--color-text-strong)',
    },
    importStatus: {
        height: 28,
        padding: '6px 10px',
        borderRadius: 8,
        background: '#F3F4F6',
        color: '#4B5563',
        fontSize: 12,
        fontWeight: "var(--font-weight-semibold)",
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    importStatusRunning: {
        background: '#ECFDF5',
        color: '#047857',
    },
    importProgressTrack: {
        height: 8,
        overflow: 'hidden',
        borderRadius: 8,
        background: '#EEF2F7',
        marginBottom: 14,
    },
    importProgressBar: {
        height: '100%',
        borderRadius: 8,
        background: 'var(--color-info)',
        transition: 'width 0.3s ease',
    },
    importStatsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 8,
        marginBottom: 14,
    },
    importStat: {
        border: '1px solid #EDF0F5',
        borderRadius: 8,
        padding: '10px 8px',
        '& span': {
            display: 'block',
            color: 'var(--color-text-muted)',
            fontSize: 11,
            marginBottom: 4,
        },
        '& strong': {
            display: 'block',
            color: 'var(--color-text-strong)',
            fontSize: 14,
            lineHeight: '18px',
        }
    },
    importTiers: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 12,
    },
    importTierRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        background: '#F8F8F9',
    },
    importTierName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: 14,
        color: 'var(--color-text-strong)',
    },
    importTierMeta: {
        fontSize: 12,
        color: 'var(--color-text-muted)',
    },
    importPanelActions: {
        display: 'flex',
        gap: 10,
        marginTop: 14,
        marginBottom: 10,
    },
    importMuted: {
        color: 'var(--color-text-muted)',
        fontSize: 12,
        lineHeight: '18px',
    },
    importError: {
        marginTop: 8,
        padding: '8px 10px',
        borderRadius: 8,
        background: '#FEF2F2',
        color: '#B91C1C',
        fontSize: 12,
    },
})
