import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width: 'calc(100% - (100% - 1204px) / 2)',
        marginLeft: 'calc((100% - 1204px) / 2)',
    },
    titleWrapper: {
        gap: 16,
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10,

        '& > div': {
            color: 'var(--color-text-muted)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '20px',
            lineHeight: '24px',
        },

        '& span': {
            color: 'var(--color-info)',
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
        },

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
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