import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #F8F8F9',
        padding: '0 23px',
    },
    valueWrapper: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        color: 'rgba(115, 128, 148, 0.5)',
        padding: '0 16px 8px 16px',
        marginBottom: -2,
        cursor: 'pointer',
    },
    activeValue: {
        color: 'var(--color-text-primary)',
        borderBottom: '2px solid var(--color-primary)',
    }
})