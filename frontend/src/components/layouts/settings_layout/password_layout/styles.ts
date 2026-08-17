import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width: 1366,
        margin: '24px auto 0',
    },
    inputLabel: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        marginBottom: 7,
        marginTop: 20,
    },
    input: {
        width: 328,
        height: 48,
        background: '#F8F8F9',
        borderRadius: 8,
        border: 'none',
        padding: '10px 12px',

        '&::placeholder': {
            fontWeight: "var(--font-weight-medium)",
            fontSize: '14px',
            lineHeight: '16px',
            color: 'rgba(115, 128, 148, 0.5)',
        }
    },
    button: {
        width: '328px',
        marginTop: 32,
    }
})