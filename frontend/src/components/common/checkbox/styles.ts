import {createUseStyles} from 'react-jss';

interface Props {
    active: boolean;
}

export const useStyles = createUseStyles({
    wrapper: {
        width: 'max-content',

        '& label': {
            cursor: 'pointer',
            display:'flex',
            flexDirection:'row-reverse',
            alignItems:'center',
            gap:'14px',
            fontFamily:'inherit'
        },
    },
    label: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
    },
    inputWrapper: {
        position: 'relative'
    },
    input: {
        position: 'absolute',
        opacity: 0,
        cursor: 'pointer',
        height: 0,
        width: 0,
    },
    checkmark: {
        position: 'absolute',
        top: -9,
        left: -8,
        height: 16,
        width: 16,
        borderRadius: 4,
        background: ({active}: Props) => active ? 'var(--color-primary)' : 'white',
        border: ({active}: Props) => active ? '1px solid var(--color-primary)' : '1px solid rgba(83, 98, 124, 0.25)',

        '&:after': {
            content: '""',
            position: 'absolute',
            display: ({active}: Props) => active ? 'block' : 'none',
            top: 7,
            left: 3,
            width: 4,
            height: 2,
            transform: 'rotate(45deg)',
            background: 'white',
        },

        '&:before': {
            content: '""',
            position: 'absolute',
            display: ({active}: Props) => active ? 'block' : 'none',
            top: 6,
            left: 4,
            width: 9,
            height: 2,
            transform: 'rotate(-45deg)',
            background: 'white',
        }
    }
})