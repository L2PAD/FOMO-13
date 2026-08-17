import { createUseStyles } from 'react-jss';

export const useStyles = createUseStyles({
    descriptionWrapper: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
        marginBottom: 12,

        '& > span': {
            color: 'var(--color-text-muted)'
        },
    },
    newsWrapper: {
        marginTop: 19,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    actions: {
        display: 'flex',
        gap: "12px"
    }
})
