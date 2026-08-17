import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        position:'fixed',
        top:'0',
        left:'0',
        bottom:'0',
        right:'0',
        display: 'flex',
        alignItems: 'center',
        justifyContent:'center',
    },
    body:{
        maxWidth:"320px",
        width:'100%',
        display:'flex',
        flexDirection:"column",
        gap:"25px",
        padding:"25px 15px",
        border:'1px solid var(--color-text-muted)',
        borderRadius:'20px'
    },
    inputs:{
        display:'flex',
        flexDirection:"column",
        gap:"14px",
    },
    input:{
        border:'none',
        padding:'8px',
        borderRadius:"8px",
        borderBottom:'1px solid var(--color-text-muted)'
    }
})