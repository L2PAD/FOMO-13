import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        padding: '8px 0',
        background: '#F8F8F9',
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        width: 1366,
        padding: '0 23px',
        margin: '0 auto',

        '& > div': {
            color: 'var(--color-text-muted)',
            fontSize: '12px',
            fontWeight: "var(--font-weight-regular)",
            lineHeight: '14px',
        }
    },
    userWrapper: {
        width: 240,
    },
    walletWrapper: {
        width: 785,
    },
    statusWrapper: {
        width: 165,
    },
    loginWrapper: {
        width: 200,
    },
})