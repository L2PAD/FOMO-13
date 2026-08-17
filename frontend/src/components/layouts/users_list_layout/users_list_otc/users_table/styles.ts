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
    userWrapper: {
        width: 154,
    },
    walletWrapper: {
        width: 140,
    },
    statusWrapper: {
        width: 105,
    },
    pointsWrapper: {
        width: 100,
    },
    dealsLoading :{
        paddingBottom:30,
        textAlign: 'center', marginTop: '20px',
        fontWeight: "var(--font-weight-semibold)",
    }
})