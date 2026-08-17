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
        width: '100%',
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
        display: 'flex',
        flexDirection: 'column',
        gap: 5,

        '& span': {
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',

            '&.green': {
                color: 'var(--color-primary)'
            },

            '&.gray': {
                color: 'var(--color-text-muted)',
            }
        },
    },
    subsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 7,
    },
    subsItem: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',

        '& img': {
            width: 20,
            height: 20,
            borderRadius: 100,
        },
    },
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
    contentWrapper: {
        marginTop: 52,
    },
    contentTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '20px',
        lineHeight: '24px',
        color: 'var(--color-text-muted)',
        marginBottom: 14,
    },
    nftsHeaderWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    flexCardWrapper: {
        marginTop: 15,
        display: 'flex',
        gap: 17,
        flexWrap: 'wrap',
    },
    investorsEditRow: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--color-info)',
        marginTop: 8,
        gap: 6,
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    flagsColumnTitle: {
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '16px',
        lineHeight: '19px',
        gap: 6,
        display: 'flex',
        alignItems: 'center',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            },
        }
    },
    flagsContentWrapper: {
        display: 'flex',
        gap: 54,
        width: '100%',

        '& > div': {
            width: '40%',
        },
    },
    flagsColumnWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
        marginTop: 12,

        '& > div': {
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        },
    },
    ratingsMediaLinksWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,

        '& a': {
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--color-primary)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '17px',
        },
    }
})