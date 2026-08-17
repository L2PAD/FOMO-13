import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    value: {
        color: 'rgba(115, 128, 148, 0.5)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '12px',
        lineHeight: '14px',
    },
    activeValue: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '12px',
        lineHeight: '14px',
    },
})