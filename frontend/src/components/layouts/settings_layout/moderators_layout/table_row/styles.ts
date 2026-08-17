import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        borderBottom: '1px solid #EEEEEE',
        borderTop: '1px solid #EEEEEE',
    },
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 23px',
        width: 1366,
        margin: '0 auto',
    },
    userWrapper: {
        width: 264,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',

        '& img': {
            width: 32,
            height: 32,
            borderRadius: 100,
        }
    },
    walletWrapper: {
        width: 785,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    statusWrapper: {
        width: 145,
    },
    loginWrapper: {
        width: 160,
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 20,
    },
})