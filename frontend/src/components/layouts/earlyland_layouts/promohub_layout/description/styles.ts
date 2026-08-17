import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        marginTop: 64,
        marginBottom: 64,
        width: 1204,
        margin: '0 auto',
    },
    articleWrapper: {
        display: 'flex',
        gap: 24,
        width: '100%',
        marginBottom: 40,

        '& img': {
            width: 603,
        }
    },
    articleText: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
    },
    editWrapper: {
        marginTop: 16,
        color: 'var(--color-info)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)',
            }
        }
    },
    underWrapper: {
        position: 'relative',

        '& img': {
            borderRadius: 8,
        }
    },
    timerWrapper: {
        border: '1px solid rgba(83, 98, 124, 0.07)',
        background: 'white',
        borderRadius: 8,
        boxShadow: '4px 4px 0px #EEEEEE',
        position: 'absolute',
        top: 32,
        left: 32,
        padding: 16,
    },
    timerEditWrapper: {
        color: 'var(--color-info)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)',
            }
        }
    },
    timerTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
        marginTop: 6,
    },
    timerStatus: {
        borderRadius: 8,
        marginTop: 1,
        background: 'rgba(244, 195, 19, 0.05)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '12px',
        lineHeight: '14px',
        width: 'max-content',
        padding: '4px 6px',
        color: '#E9B500',
    },
    timerContribution: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        color: 'var(--color-text-muted)',
    },
    timerValue: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '22px',
        marginTop: 4,
        color: 'var(--color-primary)',
    },
    actionWrapper: {
        marginTop: 16,
        width: '100%',
    },
})