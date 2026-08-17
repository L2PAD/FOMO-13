import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    descriptionWrapper: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
        marginBottom: 24,

        '& > span': {
            color: 'var(--color-text-muted)'
        },
    },
    tabContentWrapper: {
        marginTop: 16,
    }
})