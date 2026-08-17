import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width: 36,
        height: 36,

        '& svg': {
            fontSize: '40px !important'
        },

        '& .CircularProgressbar-text': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '40px',
            lineHeight: '17px',
            textAlign: 'center',
            color: 'var(--color-primary)',
            paddingTop: '5px',
        }
    }
})