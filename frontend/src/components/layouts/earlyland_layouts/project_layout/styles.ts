import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    preHeaderWrapper: {
        marginTop: 16,
    },
    preHeaderRightWrapper: {
        display: 'flex',
        marginBottom: 20,
        gap: 20,
        justifyContent: 'flex-end',
    },
    editMainWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--color-info)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            }
        }
    },
    shareWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--color-primary)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-primary)'
            }
        }
    },
    headerWrapper: {
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    leftHeaderWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '62%',
    },
    projectWrapper: {
        display: 'flex',
        gap: 16,
        alignItems: 'center',
    },
    projectImage: {
        width: 64,
        borderRadius: 100,
    },
    projectTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '32px',
        lineHeight: '39px',
        marginBottom: 4,
    },
    projectDescriptionWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    projectDescription: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
    },
    socialNetworksWrapper: {
        marginLeft: 8,
        display: 'flex',
        gap: 8,
    },
    projectDataWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 24,
    },
    projectDataCellTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
    },
    projectDataCellDescription: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,

        '& svg': {
            width: 16,
            height: 16,
            '&  path': {
                fill: 'var(--color-info)',
            }
        }
    },
    projectDataActionsWrapper: {
        display: 'flex',
        marginLeft: 8,
    },
    bioWrapper: {
        marginBottom: 10,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',

        '& span': {
            color: 'var(--color-text-muted)',
        },

        '& svg': {
            width: 16,
            cursor: 'pointer',

            '& path': {
                fill: 'var(--color-info)',
            }
        },
    },
    followersWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 27,
    },
    guideWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        fontWeight: "var(--font-weight-regular)",
        lineHeight: '16px',
        fontSize: '14px',
        color: 'var(--color-text-muted)',

        '& a': {
            color: 'var(--color-primary)',
        },
    },
    descriptionWrapper: {
        display: 'flex',
        width: '100%',
        gap: 90,
        marginTop: 18,
        marginBottom: 20,
        borderTop: '2px solid #F8F8F9',
        borderBottom: '2px solid #F8F8F9',
        padding: '17px 0',
    },
    descriptionItemTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 5,
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '16px',
        lineHeight: '19px',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    descriptionItemValue: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '16px',
        lineHeight: '19px',
    },
    articleWrapper: {
        width: 623,
        marginBottom: 60,

        '& img': {
            width: '100%',
            marginTop: 13,
            marginBottom: 37,
        }
    },
    articleText: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
    },
    articleActionsWrapper: {
        marginTop: 29,
        display: 'flex',
        gap: 16,

        '& button': {
            width: 304,
        }
    },
})