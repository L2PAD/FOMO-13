import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        width:'95%',
        margin:'40px auto'
    },
    rows:{
    },
    subTitle:{
        fontWeight: "var(--font-weight-semibold)",
        marginBottom:'12px'
    },
    itemsWrapper:{
        marginTop:'15px',

    },
    members:{
        display:'flex',
        flexWrap:'wrap',
        gap:20
    },
    title:{
    },
    row:{
        marginTop:'15px',
        marginBottom:'15px',
        marginLeft:'10px',
        display:'flex',
        gap:'15px'
    }
})