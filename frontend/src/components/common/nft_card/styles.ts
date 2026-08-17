import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width: 228,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,

        '& img': {
            width: 228,
            height: 225,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
        },
    },
    dataWrapper: {
        padding: '8px 12px 12px',
    },
    dataTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        marginBottom: 7,
    },
    dataDescription: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',

        '& > div': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
            color: 'var(--color-text-muted)',
        },

        '& > a': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '17px',
            color: 'var(--color-primary)',
        }
    }
})