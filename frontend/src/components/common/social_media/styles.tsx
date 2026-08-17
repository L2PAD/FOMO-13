import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width:'95%',
        margin:'20px auto'
    },
    title:{
        
    },
    socialItemWrapper:{
        maxWidth:'250px',

    },
    items:{
        margin:"20px 5px",
        display:'flex',
        gap:'20px',
    },
    label:{
        marginBottom:'8px',
        display:'flex',
        alignItems:'center',
        gap:'5px',
        fontSize:'14px',
    }
})