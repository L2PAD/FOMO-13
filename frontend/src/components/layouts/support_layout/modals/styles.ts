import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    TextWrapper:{
        marginTop:'10px',
        fontSize:'16px',
    },
    ButtonWrapper:{
        marginTop:'20px',
        '& button':{
            width:'100%'
        }
    }
})