import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
    },
    userDataWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 20,

        '& img': {
            width: 120,
            borderRadius: '100%',
        },
    },
    userName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '32px',
        lineHeight: '39px',
        marginBottom: '2px !important'
    },
    userDescriptionWrapper: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
    },
    walletKeyWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',
    },
    headerDataWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 32,
    },
    dataName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
        marginBottom: 4,
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
})