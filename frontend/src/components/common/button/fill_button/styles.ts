import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: 'var(--color-primary)',
        border: 'none',
        display: 'flex',
        padding: '13px 10px',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        color: 'var(--color-white)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '16px',
        lineHeight: '19px',

        transition:'all 0.2s ease',

        '&:hover':{
            background: 'var(--color-primary-dark)',
        },
        '&:active':{
            opacity:'0.7'
        },
        '&:disabled':{
            background: 'var(--color-primary)',
            color: 'var(--color-white)',
            cursor:'not-allowed'
        },
        '&.decline-btn': {
            borderColor: 'var(--color-danger)',
            background: 'var(--color-danger)',
            color:'white',
            '&:hover':{
                opacity:0.7
            }
        },
    },
})