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
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    leftHeaderWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,

        '& h1': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '32px',
            lineHeight: '39px',
        }
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

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)',
            }
        }
    },
    articleWrapper: {
        width: 623,
        margin: '0 auto 60px',

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
    progressTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 19,

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)',
            }
        }
    },
    progressValue: {
        background: 'linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%)',
        borderRadius: 8,
        height: 8,
        width: '100%',
        marginTop: 8,
        marginBottom: 13,
    },
    progressValueDescription: {
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '21px',
        gap: 6,

        '& i': {
            color: 'var(--color-text-muted)',
        },

        '& span': {
            color: 'var(--color-primary)',
        }
    },
    projectDescWrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '2px solid #F8F8F9',
        width: '100%',
        paddingBottom: 23,
        gap: 33,

        '&>div': {
            width: '48%',
        }
    },
    contractWrapper: {
        cursor: 'pointer',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        background: '#F3F4F6',
        borderRadius: 8,
        gap: 4,

        '& svg path': {
            fill: 'var(--color-text-muted)',
        }
    },
    mainContentHeader: {
        marginTop: 24,
        marginBottom: 28,
        display: 'flex',
        gap: 16,

        '& > div': {
            width: 'calc(50% - 10)'
        }
    },
    mainContentLeftWrapper: {
        padding: 16,
        borderRadius: 8,
        background: '#F8F8F9',
        border: '1px solid rgba(83, 98, 124, 0.07)',
    },
    mainContentRightWrapper: {
        padding: 16,
        borderRadius: 8,
        background: 'rgba(0, 192, 153, 0.05)',
        border: '1px solid rgba(83, 98, 124, 0.07)',
    },
    mainContentTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '24px',
        lineHeight: '29px',
        marginBottom: 8,

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)',
            }
        }
    },
    mainContentDescription: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',
        marginBottom: 16,

        '& a': {
            color: 'var(--color-primary)',
        }
    },
    mainContentTimerTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        color: 'var(--color-text-muted)',
        marginBottom: 4,
    },
    mainContentTimerValue: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '18px',
        lineHeight: '22px',
        color: 'var(--color-primary)',
    },
    tokenWrapper: {
        marginTop: 40,
    },
    tokenTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        color: 'var(--color-text-muted)',
        marginBottom: 24,
    },
    tokenDataWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
    },
    tokenRow: {
        display: 'flex',
        gap: 12,
        width: '100%',
    },
    tokenLeftRow: {
        width: 230,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 6,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        color: 'var(--color-text-muted)',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)',
            }
        }
    },
    tokenRightRow: {
        width: 429,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '16px',
    },
})