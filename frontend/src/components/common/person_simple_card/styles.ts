import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width: 228,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    imageWrapper: {
        width: 80,
        height: 80,
        borderRadius: 100,
        border: '3px solid var(--color-primary)',
        position: 'relative',
        display: 'flex',

        '& img': {
            width: '100%',
            borderRadius: 100,
        }
    },
    ratingWrapper: {
        position: 'absolute',
        top: -6,
        right: -6,
        borderRadius: 100,
        background: 'var(--color-primary)',
        color: 'white',
        width: 23,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    titleWrapper: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        marginBottom: 8,
    },
    descWrapper: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
    },
})