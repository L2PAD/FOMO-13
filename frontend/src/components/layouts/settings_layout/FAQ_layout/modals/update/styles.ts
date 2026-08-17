import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        display:'flex',
        flexDirection:'column',
        gap:'10px',
        margin:'20px 0px 15px 0px'
    },
    textFieldWrapper:{
        marginTop:"10px",
        display:'flex',
        flexDirection:'column',
        '& label':{
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
            color: 'rgb(115, 128, 148)'
        }
    },
    textField: {
        background: '#F8F8F9',
        borderRadius: '8px',
        padding: '9px 12px',
        width: '100%',
        height: '105px',
        resize: 'none',
        border: 'none',
        marginTop: '7px',
    },
    faqItems:{
        marginTop:'20px',
        display:'flex',
        flexDirection:'column',
        gap:'12px',
    },
    faqItem:{
        position:'relative',
        display:'flex',
        flexDirection:'column',
        gap:'3px',
        padding:'18px 8px',
        border:'1px solid gray',
        borderRadius:'8px'
    },
    closeItem:{
        position:'absolute',
        right:'10px',
        top:'10px'
    }
})