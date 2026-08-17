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
    },
    inputsRow:{
        display:'flex',
        justifyContent:'space-between',
        '& input':{
            width:'370px'
        },
        '& div':{
            width:'370px'
        }
    },
    datesRow:{
        display:'flex',
        justifyContent:'space-between',
        '& button.custom-input':{
            width:'370px'
        }
    },
    buttonsWrapper:{
        display:'flex',
        flexDirection:'column',
        gap:'20px',
        margin:'40px 0px 60px'
    },
    selectedNews:{
        margin:'10px 2px 10px'
    },
    faqItems:{
        display:'flex',
        flexDirection:'column',
        gap:'10px'
    },
    faqItem:{
        display:'flex',
        flexDirection:'column',
        gap:'6px'
    },
    faqItemBody:{
        position:'relative',
        marginTop: '20px',

        '& p':{
          color:'rgba(115,128,148,1)'
        },
        padding:'8px',
        background:'rgba(115,128,148,0.1)',
        borderRadius:'8px'
    },
    faqItemRemove: {
        position:'absolute',
        top:'10px',
        right:'10px',
        background:'white',
        padding:'6px',
        width:'30px',
        height:'30px',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        border:'1px solid black',
        borderRadius:'6px'
    },
    checkBoxRow:{
        marginTop:'10px',
        display:'flex',
        flexDirection:'column',
        gap:'6px',
        '& div':{
            marginLeft:'3px'
        },
        '& input':{
            marginLeft:'3px'
        },
    },
    mediaRow:{
        display:'flex',
        flexWrap:'wrap',
        gap:'6px',

        '& input':{
            maxWidth:'180px'
        }
    },
    mediaItemWrapper:{
        position:'relative',
    },
    mediaItemRemove: {
        position:'absolute',
        top:'3px',
        right:'3px',
        background:'white',
        padding:'6px',
        width:'30px',
        height:'30px',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        borderRadius:'6px',
        border:'none'
    },
})