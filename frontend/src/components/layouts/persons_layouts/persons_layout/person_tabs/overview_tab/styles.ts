import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    graphicWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    graphicTopWrapper: {
        width: 320,
        background: 'white',
        padding: 16,
        borderRadius: 8,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        marginBottom: 16,
    },
    graphicTopTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        marginBottom: 16,

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    graphicTopRow: {
        display: 'flex',
        gap: 54,
    },
    graphicTopCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: 5,

        '& > div': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '16px',
            lineHeight: '19px',
        },

        '& span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '16px',
            lineHeight: '19px',
        },
    },
    graphicBottomRow: {
        display: 'flex',
        justifyContent: 'space-between',

        '&:not(:first-child)': {
            paddingTop: 19,
        },
        '&:not(:last-child)': {
            borderBottom: '2px solid #F8F8F9',
            paddingBottom: 10,
        }
    },
    graphicBottomRowTitle: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '16px',
        lineHeight: '19px',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        color: 'var(--color-text-muted)',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        },

        '& + span': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '14px',
            lineHeight: '16px',
            color: 'var(--color-text-muted)',
        }
    },
    graphicBottomRowValue: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '16px',
        lineHeight: '19px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        textAlign: 'right',

        '& span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        }
    },
})