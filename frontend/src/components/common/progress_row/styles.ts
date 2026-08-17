import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    progressRow: {
        background: 'rgba(115, 128, 148, 0.15)',
        height: 4,
        width: 134,
        borderRadius: 8,

        '& > div': {
            background: 'linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%)',
            borderRadius: 8,
            height: 4,
            width: (props: number) => `${props}%`
        },
    },
})