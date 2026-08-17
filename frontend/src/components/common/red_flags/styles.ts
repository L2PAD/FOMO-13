import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        lineHeight: '16px',
    }
})