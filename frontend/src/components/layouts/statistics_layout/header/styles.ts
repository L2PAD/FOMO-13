import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 23px 10px'
    },
    leftWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    mainTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '40px',
        lineHeight: '48px',
    },
    actionsWrapper: {
        display: 'flex',
        gap: 18,
        alignItems: 'center',
    },
    chooseWrapper: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',

        '& span': {
            color: 'var(--color-text-primary)',
            fontWeight: "var(--font-weight-semibold)",
        },
    },
    checkboxWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
})