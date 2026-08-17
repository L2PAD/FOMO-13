import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        border: '1px solid var(--color-primary)',
        background: 'white',
        borderRadius: 8,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '32px',
        lineHeight: '19px',
        color: 'var(--color-primary)',
        padding: '8px 12px',
        transition:'all 0.3s ease',
        '&:hover': {
            background:'var(--color-primary)',
            color:'white'
        }
    },
})