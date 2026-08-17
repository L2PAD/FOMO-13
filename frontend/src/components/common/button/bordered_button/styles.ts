import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        border: '1px solid var(--color-primary)',
        background: 'white',
        borderRadius: 8,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '16px',
        lineHeight: '19px',
        color: 'var(--color-primary)',
        padding: '8px 12px',
        transition:'all 0.2s ease',

        '&:hover':{
            background:'var(--color-primary)',
            color:'white',
        },
        '&:active':{
            opacity:'0.7',
        },
        '&.progress-inwork':{
            color:'#F9A353',
            border: '1px solid #F9A353',

            '&:hover':{
                background:'#F9A353',
                color:'white',
            }
        },
        '&.progress-upcoming':{
            color:'#B9C0CA',
            border: '1px solid #B9C0CA',
            
            '&:hover':{
                background:'#B9C0CA',
                color:'white',
            }
        },
        '&.decline-btn': {
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
    
            '&:hover':{
                borderColor: 'var(--color-danger)',
                background: 'var(--color-danger)',
                color:'white'
            }
        },
        '&.blue-btn':{
            background:'white',
            color:'rgb(107, 177, 252)',
            border:'1px solid rgb(107, 177, 252)',
            '&:hover':{
                background: 'rgb(107, 177, 252)',
                color:'white'
            }
        }
    }
})