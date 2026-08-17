import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper:{
        width:'250px',
        height:'250px',
        position:'relative',
        border:'1px solid var(--color-primary)',
        borderRadius:8,
        padding: '8px 12px',
        '&  img':{
            width:'100px',
            borderRadius:'15px'
        }
   
    },
    closeBtn:{
        position:'absolute',
        top:'10px',
        right:'10px',
        background:'transparent',
        border:'none'
    },
    inputsWrapper:{
        display:'flex',
        flexDirection:'column',
        gap:'10px',
   
    },
    head:{
        marginTop:15,
        marginBottom:15,
        display:'flex',
        gap:10
    },
    info:{
        display:'flex',
        flexDirection:'column',
        gap:10
    },
    infoItem:{
        display:'flex',
        flexDirection:'column',
    },
    key:{
        fontSize:14,
        color:'gray',
    },
    value:{
        fontSize:17,
        fontWeight: "var(--font-weight-semibold)",
    },
    details:{
        marginTop:12,
        marginLeft:5
    },
    buttons:{
        display:'flex',
        gap:8,
        position:'absolute',
        top:7,
        right:15
    }
})