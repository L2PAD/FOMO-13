import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    input:{
        'opacity':'0',
        'position':'absolute',
        'left':'0',
        'top':'0',
        'width':'88px',
        'height':'88px',
        'cursor':'pointer'
    },
    label:{
        'cursor':'pointer',
        'fontFamily': 'Gilroy',
        'fontWeight': '600',
        'fontSize': '14px',
        'lineHeight': '17px',
        'color': 'var(--color-primary)',
    },
    inputWrapper:{
        'position':'relative',
        'display':'flex',
        'alignItems':'center',
    },
    logo:{
        'width': '88px',
        'height': 'auto',
        'maxHeight':'88px',
        'borderRadius': '8px',    
        'objectFit':'contain',
    }
})