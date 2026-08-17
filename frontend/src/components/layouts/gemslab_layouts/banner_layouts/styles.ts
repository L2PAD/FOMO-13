import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    Wrapper: {
        maxWidth:'96%',
        margin:'30px auto',
        padding:'0px 25px'
    },
    mainWrapper: {
        marginBottom: 60,
    },
    Head:{
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between'
    },
    List:{
        display:'flex',
        flexWrap:'wrap',
        gap:'10px',
    }
})