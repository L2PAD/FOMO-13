import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: 'rgba(0, 192, 153, 0.1)',
        border: 'none',
        display: 'flex',
        padding: '8px 10px',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        color: 'var(--color-primary)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '16px',
        lineHeight: '19px',
    },
})