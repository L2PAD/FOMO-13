import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    createWrapper:{
        maxWidth:'250px',
        width:'100%',
        minHeight:'260px',
        position:'relative',
        border:'1px solid var(--color-primary)',
        borderRadius:8,
        padding: '8px 12px',
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
        '&  img':{
            width:'90px',
        }
    }
})