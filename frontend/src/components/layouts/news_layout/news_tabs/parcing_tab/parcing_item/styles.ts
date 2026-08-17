import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        padding: '18px 16px',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        width: 289,
    },
    userDataWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,

        '& > img': {
            width: 64,
            borderRadius: 100,
        }
    },
    followers: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '12px',
        lineHeight: '14px',
        marginBottom: 3,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
        }
    },
    nickName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
        width: 178,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginBottom: 4,
    },
    description: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',
        width: 184,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    text: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',
        marginBottom: 12,

        '& > span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '12px',
            lineHeight: '14px',
        }
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    link: {
        color: 'var(--color-primary)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    buttonsWrapper: {
        display:'flex',
        alignItems:'center',
        gap:'8px'
    }
})