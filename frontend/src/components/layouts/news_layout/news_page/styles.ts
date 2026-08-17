import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        marginTop: 24,
        width: 580,
        margin: '0 auto',

        '& > img': {
            width: '100%',
            marginBottom: 24,
        }
    },
    headerWrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    newsDate: {
        marginBottom: 8,
        color: 'rgba(7, 11, 53, 0.5)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    articleTitle: {
        color: '#0D0F2B',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '48px',
        lineHeight: '58px',
        marginBottom: 18,
    },
    articleText: {
        '& > p': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '18px',
            lineHeight: '21px',
        },
        '& > h1, & > h2, & > h3, & > h4, & > h5, & > h6': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '24px',
            lineHeight: '29px',
        }
    },
    recommendedTitle: {
        marginTop: 64,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '28px',
        lineHeight: '24px',
        color: 'var(--color-text-muted)',
        marginBottom: 8,
    },
    newsWrapper: {
        marginTop:"30px",
        display: 'flex',
        alignItems:'center',
        justifyContent:'center',
        gap: 16,
        flexWrap: 'wrap'
    },
    recommendedWrapper:{
        display:'flex',
        flexDirection:'column',
        alignItems:'center'
    },
    buttons:{
        display:'flex',
        gap:"10px"
    },
})