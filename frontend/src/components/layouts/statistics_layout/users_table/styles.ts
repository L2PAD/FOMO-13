import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: '#F8F8F9',
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '7px 23px',

        '& > div': {
            color: 'var(--color-text-muted)',
            fontWeight: "var(--font-weight-regular)",
            fontSize: '12px',
            lineHeight: '14px',
        },
    },
    checkboxWrapper: {
        width: 40,
    },
    userWrapper: {
        width: 134,
    },
    walletWrapper: {
        width: 255,
    },
    statusWrapper: {
        width: 95,
    },
    pointsWrapper: {
        width: 70,
    },
    emailWrapper: {
        width: 160,
    },
    stakingWrapper: {
        width: 132,
    },
    telegramWrapper: {
        width: 158,
    },
    flagsWrapper: {
        width: 100,
    },
})