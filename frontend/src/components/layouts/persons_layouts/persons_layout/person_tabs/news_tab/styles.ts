import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    newsRowWrapper: {
        display: 'flex',
        width: '100%',
        overflowX: 'auto',
        gap: 16,
        paddingBottom: 20,
    },
    newsWrapper: {
        minWidth: 584,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        padding: 16,
    },
    newsTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 6,

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    newsDate: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        marginBottom: 8,
    },
    newsText: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
    }
})