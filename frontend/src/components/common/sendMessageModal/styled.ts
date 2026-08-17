import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        marginTop:'10px',
        display:'flex',
        flexDirection:'column',
        gap:'12px'
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
    textFieldWrapper:{
        marginTop:"10px",
        display:'flex',
        flexDirection:'column',
        '& label':{
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
            color: 'rgb(115, 128, 148)'
        },
        '& div':{
            marginTop:'10px',
            fontSize: '17px',
            lineHeight: '17px',
        }
    },
    checkBoxWrapper:{
        display:'flex',
        flexDirection:'column',
        gap:10,
        margin:'6px'
    }
})