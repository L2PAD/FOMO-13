import {createUseStyles} from 'react-jss';

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
        justifyContent: 'space-between',
    },
    dataWrapper: {
        display: 'flex',
        alignItems: 'center',
    },
    userWrapper: {
        width: 154,
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
        width: 140,
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
        display:'flex',
        alignItems:'center',
        gap:'5px',
        width: 105,
        fontSize:'14px'
    },
    pointsWrapper: {
        width: 100,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    actionsWrapper: {
        width: 145,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    reactionButton: {
        border: 'none',
        padding: '4px 8px',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 8,

        '&:last-child': {
            marginRight: 10,
        },

        '&.checked': {
            color: 'white',
            background: 'var(--color-primary)',
        },
    },
    bio:{
        maxWidth:'720px',
        marginTop:'6px',
        padding: '0px 23px 16px 28px',

        '& span':{
            color:'gray'
        }
    }
})