import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        marginTop: 16,
        display: 'flex',
        gap: 32,

        '& > div': {
            width: 'calc(50% - 16px)',
        }
    },
    imageWrapper: {

        '& img': {
            width: '100%',
            borderRadius: 24,
        },
    },
    userDataWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',

        '& img': {
            width: 20,
            height: 20,
            borderRadius: 100,
        }
    },
    contentHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent :'space-between',
        marginBottom: 12,
    },
    contentHeaderEditWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',
        color: 'var(--color-info)',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    projectTitleWrapper: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '32px',
        lineHeight: '39px',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        marginBottom: 8,

        '& span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
            color: 'var(--color-text-muted)',
            background: 'rgba(115, 128, 148, 0.1)',
            padding: '4px 10px',
            borderRadius: 8,
        }
    },
    projectDescription: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',

        '& span': {
            color: 'var(--color-text-muted)',
        }
    },
    projectPriceWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 24,

        '& img': {
            width: 40,
            height: 40,
            borderRadius: 100,
        }
    },
    projectPriceTitle: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        marginBottom: 3,

        '& span': {
            fontWeight: "var(--font-weight-semibold)",
        }
    },
    projectPriceValue: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
    },
    creatorWrapper: {
        marginTop: 34,
        padding: 16,
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        width: 'max-content',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    creatorTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        marginBottom: 3,
    },
    creatorRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 0',
        borderBottom: '2px solid #F8F8F9',
    },
    creatorRowTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '16px',
        lineHeight: '19px',
    },
    creatorRowValue: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '16px',
        lineHeight: '19px',
    },
})