import styled from 'styled-components';
import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    searchWrapper: {
        position: 'relative',

        '& > svg': {
            position: 'absolute',
            bottom: 5,
            left: 12,
        }
    },
    searchInput: {
        border: 'none',
        background: '#F8F8F9',
        borderRadius: 8,
        padding: '8px 12px 8px 35px',
        width: '100%',

        '&::placeholder': {
            marginTop: 10,
            color: 'rgba(115, 128, 148, 0.5)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '16px',
            lineHeight: '19px',
        }
    },
})

export const SearchWrapper = styled.div`
  margin-top: 24px;
`
export const HeaderWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const ContentWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const CommentWrapper = styled.div`
  width: 100% !important;
  position: relative !important;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #EEEEEE;
  border-radius: 8px;
`
export const ActionsWrapper = styled.div`
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;
  position: absolute;
  top: 32px;
  right: 16px;
`

export const DefaultActionWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
    display: flex;
    gap: 8px;
  }
`

export const RatingWrapper = styled.i`
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 16px;
    margin-top: -3px;
  }
`

export const StatusWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
  }
`

export const UserDataWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 9px;
  
  img {
    width: 32px;
    height: 32px;
    border-radius: 100px;
  }
`

export const UserData = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  
  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;

    color: var(--color-text-muted);
  }
`
export const CommentText = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  margin-bottom: 8px;
`
export const ReactionsWrapper = styled.div`
  display: flex;
  gap: 10px;
  
  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    background: #F8F8F9;
    border-radius: 99px;
    padding: 4px 8px;
  }
`

export const DealWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  
  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`