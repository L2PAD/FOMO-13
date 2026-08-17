import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        gap: 6,
        alignItems: 'center',
    },
    imageWrapper: {
        display: 'flex',
        alignItems: 'center',

        '& img': {
            width: 20,
            height: 20,
            border: '1px solid white',
            borderRadius: '100%',

            '&:not(:first-child)': {
                marginLeft: -8,
            }
        }
    },
    valueWrapper: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',

        '& span': {
            color: 'var(--color-primary)',
            fontWeight: "var(--font-weight-semibold)",
        }
    },
})