import {createUseStyles} from 'react-jss';

interface Props {
    status: string,
    rating: number,
}

export const useStyles = createUseStyles({
    wrapper: {
        background: ({status}: Props) => status ? 'rgba(255, 88, 88, 0.05)' : 'white',
        cursor:'pointer',
        transition:'all 0.3s ease',

        '&:hover':{
            background:'rgb(0, 192, 153,0.1)'
        },
        '&:active':{
            background:'rgb(0, 192, 153,0.2)'
        }
    },
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 23px',
        borderBottom: '1px solid #eee',
    },
    projectWrapper: {
        width: 249,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        '& img':{
            borderRadius:'8px',
        }
    },
    projectImage: {
        width: 32,
    },
    projectDataWrapper: {
        display: 'flex',
    },
    projectTitle: {
        display: 'flex',
        alignItems: 'center',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        gap: 6,

        '& span': {
            color: 'var(--color-primary)',
        }
    },
    projectDescription: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '17px',
        color: 'var(--color-text-muted)',
    },
    statusWrapper: {
        width: 249,
    },
    investorsWrapper: {
        width: 249,
    },
    raisedWrapper: {
        width: 249,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    fundingWrapper: {
        width: 249,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    typeWrapper: {
        width: 81,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    tagCircle: {
        width: 249,
        height: 16,
        background: 'rgba(115, 128, 148, 0.5)',
        borderRadius: '100%',
    },
    tagWrapper: {
        width: 249,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '12px',
        lineHeight: '14px',
        color: 'var(--color-text-muted)',
    },
    flagsWrapper: {
     width: 249,
    },
    ratingWrapper: {
        width: 118,
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    dotsAction: {
        '& svg circle': {
            fill: 'rgba(115, 128, 148, 0.5)',
        }
    },
    fileBtn:{
        display:'flex',
        alignItems:'center',
        gap:'5px',
        padding:'2px',
        border:'none',
        background:'transparent',
        '& svg':{
            width:'18px',
            height:'auto',
            fill:'rgb(0, 192, 153) !important',
        },
        '& span':{
            fontWeight: "var(--font-weight-semibold)",
        }
    }
})