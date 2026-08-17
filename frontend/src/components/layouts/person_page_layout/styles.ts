import styled from 'styled-components';
import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
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
            gap: 8,
        },

        '& svg':{
          minWidth:12,
        }
    },
})

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`

export const UserAvatarWrapper = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 100px;

  @media (max-width: 767px) {
    width: 48px !important;
    height: 48px !important;

    span {
      font-size: 14px;
      line-height: 17px;
      width: 26px;
      height: 26px;
    }
  }
`

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
`

export const HeaderInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 1204px) {
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    gap: 28px;
  }
`

export const HeaderUserInfoWrapper = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

`

export const HeaderUserName = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);
  width: 100%;

  @media (max-width: 767px) {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    width: 220px;
  }
`

export const RatingCircleWrapper = styled.div`
  margin-top: -10px;
  width: 36px;
  height: 36px;

  .CircularProgressbar-text {
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 17px;
    text-align: center;
    color: var(--color-primary);
    padding-top: 5px;
  }
`

export const HeaderUserDescriptionWrapper = styled.div`
  margin-top: 4px;
  display: flex;
  gap: 12px;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);

  @media (max-width: 767px) {
    flex-direction: column;
  }
`

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
`

export const HeaderDataWrapper = styled.div`
  display: flex;
  gap: 34px;
  align-items: center;

  @media (max-width: 1024px) {
    justify-content: space-between;
    width: 100%;
  }
  @media (max-width: 767px) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`

export const HeaderDataRightWrapper = styled.div`
  display: flex;
  gap: 34px;

  @media (max-width: 767px) {
    justify-content: flex-start;
    gap: 10px;
  }
`

export const HeaderDataFollowersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const HeaderDataFollowersTitle = styled.p`
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

export const CurrentRoiValue = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-primary);
  margin-bottom: 4px;
`

export const CurrentRoiDescription = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`

export const ActionsWrapper = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 767px) {
    gap: 10px;
  }
`

export const HeaderDescription = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: inherit !important;
  p{
    margin-bottom: 6px;
  }
  span {
    color: var(--color-text-muted);
  }

  svg {
    width: 16px;

    path {
      fill: var(--color-info);
    }
  }
`

export const ParticipatedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 40px;
`

export const ParticipatedHeaderWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

export const ParticipatedTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
  
  svg {
    width: 16px;

    path {
      fill: var(--color-info);
    }
  }
`

export const NFTsWrapper = styled.div`
  display: flex;
  gap: 16px;
`

export const AvatarWrapper = styled.div`
  max-width:64px;
  max-height:64px;
  border-radius:50%;
  overflow:hidden;
  img {
    max-width:64px;
    width:100%;
    object-fit:cover;
  }
`

export const ButtonEdit = styled.button`
  background:transparent;
  border:none;
`

export const EditBtnsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 12px;
`

export const EditStateWrapper = styled.div`
  input{
    width: 280px;
    padding: 4px 8px;
    height: 38px;
    border-radius: 6px;
    background: var(--input-edit-bg);
    border: none;
    transition: all 0.3s ease;
    font-size: 14px;

    &::placeholder{
      color: var(--color-text-muted);
    }
    &:hover{
      background: var(--input-hover);
    }
    &:focus{
      background: var(--input-active);
    }
  }

  textarea{
    max-width: 590px;
    height: 65px;
    width: 100%;
    padding: 4px 8px;
    border-radius: 6px;
    background: var(--input-edit-bg);
    border: none;
    transition: all 0.3s ease;
    font-size: 14px;

    &::placeholder{
      color: var(--color-text-muted);
    }
    &:hover{
      background: var(--input-hover);
    }
    &:focus{
      background: var(--input-active);
    }
  }
`