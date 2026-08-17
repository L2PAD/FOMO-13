import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        paddingBottom: 16,
        marginTop: 16,
        borderBottom: '2px solid #F8F8F9',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userDataWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,

        '& > img': {
            width: 32,
            borderRadius: 100,
        }
    },
    userName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    pubDate: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    text: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    reaction: {
        padding: '5px 8px',
        borderRadius: 8,
        background: '#F8F8F9',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        width: 'max-content',
    },
    reactionWrapper: {
        display: 'flex',
        gap: 10,
        marginTop: 8,
    },
    chosenReaction: {
        padding: '5px 8px',
        borderRadius: 8,
        background: 'var(--color-primary)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        width: 'max-content',
        color: 'white',
    },
})