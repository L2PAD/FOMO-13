import {createUseStyles} from 'react-jss';
import styled from 'styled-components';
import Typography from '../../../common/typography';

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
        width: 86,
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
        marginTop:10    ,
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
        gap: 50,
        marginTop: 18,
        marginBottom: 20,
        borderTop: '2px solid #F8F8F9',
        borderBottom: '2px solid #F8F8F9',
        padding: '17px 0',
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
    flexCardWrapper: {
        marginTop: 15,
        display: 'flex',
        gap: 17,
        flexWrap: 'wrap',
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
    projectTabsWrapper: {
        marginTop:'20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
    },
})

export const ProgressRangeWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 40px;
`

export const LeftWrapperTitle = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
`

export const CurrentRangeValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  margin-bottom: 6px;
  
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-primary);
    padding: 4px 6px;
    background: rgba(5, 201, 161, 0.05);
    border-radius: 8px;
    margin-left: 6px;
  }
`

export const CurrentRangeValueCurrency = styled.div`
  margin-bottom: 6px;
  font-style: normal;
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
  
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-primary);
    margin-left: 6px;
  }
`

export const PriceRangeTitle = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 9px;
`

export const RangeWrapper = styled.div`
    width: 70%;
`

export const RangeBar = styled.div<{value: number}>`
  background: #F3F4F6;
  border-radius: 8px;
  width: 100%;
  height: 8px;
  margin-bottom: 10px;
  
  div {
    background: linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%);
    border-radius: 8px;
    height: 8px;
    width: ${({value}) => value}%
  }
`

export const RangeValues = styled.div`
  display: flex;
  justify-content: space-between;
  
  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
    
    span {
      font-weight: var(--font-weight-semibold);
      font-size: 12px;
      line-height: 14px;
      margin-left: 5px;
    }
  }
`

export const HeaderDataWrapper = styled.div`
  display: flex;
  gap: 34px;
  align-items: center;
  flex-wrap: wrap;
`

export const HeaderDataRightWrapper = styled.div`
  display: flex;
  gap: 34px;

`

export const HeaderDataFollowersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const HeaderDataFollowersTitle = styled(Typography)`
  display: flex;
  gap: 4px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  align-items: center;
`

export const HeaderDataFollowersItemsWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

export const HeaderDataFollowersItem = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

export const CurrentRoiValue = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-primary);
  margin-bottom: 4px;
`

export const CurrentRoiDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`

export const ActionsWrapper = styled.div`
  display: flex;
  gap: 24px;
`

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
  gap: 2px;
`
export const ProjectCardLink = styled.a`
  margin: 5px;
  width: 289px !important;
  border-radius: 8px;
    border: 1px solid rgba(83, 98, 124, 0.07);
    box-shadow: 4px 4px 0px #EEEEEE;
  & > div {
    width: 100% !important;
  }

  @media(max-width: 1204px) {
    width: 32% !important;
  }

  @media(max-width: 932px) {
    width: 48% !important;
  }

  @media(max-width: 631px) {
    width: 100% !important;
  }
`