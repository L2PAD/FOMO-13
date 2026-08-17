import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        padding: 8,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        width: 385,

        '& > img': {
            width: '100%',
            height: 219,
        },
    },
    articleDate: {
        marginTop: 8,
        marginBottom: 8,
        color: 'rgba(7, 11, 53, 0.5)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    articleTitle: {
        marginBottom: 6,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
        color: '#0D0F2B',
        overflow: 'hidden',
        display: '-webkit-box',
        '-webkit-line-clamp': 2,
        '-webkit-box-orient': 'vertical',
    },
    articleText: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '16px',
        lineHeight: '19px',
        color: 'var(--color-text-muted)',
        overflow: 'hidden',
        display: '-webkit-box',
        '-webkit-line-clamp': 3,
        '-webkit-box-orient': 'vertical',
        height:'57px',
        overflowY:'hidden'
    },
})