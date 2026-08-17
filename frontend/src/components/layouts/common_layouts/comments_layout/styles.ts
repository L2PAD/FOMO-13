import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    title: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        marginBottom: 12,
    },
    contentWrapper: {
        display: 'flex',
        gap: 16,

        '& > div': {
            width: 'calc(50% - 8px)'
        },
    },
    commentsWrapper: {
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        padding: '16px 25px 16px 16px',
        maxHeight: 320,
        overflowY: 'auto',
    },
    commentWrapper: {
        borderBottom: '2px solid #F8F8F9',
        padding: '16px 0',

        '&:first-child': {
            paddingTop: 0,
        }
    },
    commentHeaderWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    commentLeftHeaderWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    commentUserAvatar: {
        width: 32,
        height: 32,
        borderRadius: 100,
    },
    commentUserName: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    commentDate: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    commentText: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    newCommentWrapper: {
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        padding: 16,
        height: 'max-content',

        '& textarea': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
            border: 'none',
            borderRadius: 8,
            background: '#F8F8F9',
            height: 180,
            resize: 'none',
            padding: '9px 12px',
            width: '100%',
            marginBottom: 16,

            '&::placeholder': {
                fontWeight: "var(--font-weight-regular)",
                fontSize: '14px',
                lineHeight: '16px',
                color: 'var(--color-text-muted)',
            }
        },

        '& button': {
            width: '100%',
        }
    },
})