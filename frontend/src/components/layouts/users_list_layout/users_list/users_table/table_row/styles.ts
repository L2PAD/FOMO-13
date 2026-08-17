import {createUseStyles} from 'react-jss';


interface Props {
    status: boolean,
}

export const useStyles = createUseStyles({
    wrapper: {
        background: 'white',
        border: '1px solid #EEEEEE',
        borderLeft: 'none',
        borderRight: 'none',
    },
    rowWrapper: {
        padding: '16px 23px',
        display: 'flex',
        alignItems: 'center',
    },
    checkboxWrapper: {
        width: 40,
    },
    userWrapper: {
        width: 164,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',

        '& img': {
            width: 32,
            borderRadius: 100,
        },
    },
    walletWrapper: {
        width: 245,
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
    },
    statusWrapper: {
        width: 125,
    },
    pointsWrapper: {
        width: 60,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    emailWrapper: {
        width: 200,
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        lineHeight: '17px',
        
    },
    stakingWrapper: {
        width: 102,
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    telegramWrapper: {
        width: 158,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
    },
    flagsWrapper: {
        width: 68,
    },
    ratingWrapper: {
        width: 140,
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    userName:{
        maxWidth:'80px',
        overflow:'auto'
    },
    notconnected:{
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',
    }
})