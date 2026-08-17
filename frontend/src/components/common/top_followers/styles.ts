import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    headerWrapper: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',

        '& svg': {
            width: 14,
            height: 14,
            '& path': {
                fill: 'var(--color-text-muted)',
            },
        }
    },
    subsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 7,
    },
    subsItem: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',

        '& img': {
            width: 20,
            height: 20,
            borderRadius: 100,
        },
    },
})