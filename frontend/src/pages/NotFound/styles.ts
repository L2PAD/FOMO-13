import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 100,
    },
    logoWrapper: {
        width: 149,
        height: 50,

        '& img': {
            width: '100%',
        },
    },
    contentWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    errorNumber: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: 320,
        color: 'var(--color-text-primary)',
        lineHeight: '387px',
        marginBottom: -50,
    },
    title: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: 40,
        lineHeight: '48px',
        color: 'var(--color-text-primary)',
    },
    link: {
        marginTop: 24,
        background: 'var(--color-primary)',
        borderRadius: 8,
        border: 'none',
        padding: 13,
        width: 328,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: 18,
        lineHeight: '22px',
        color: 'white',
        textAlign: 'center',
    },
})