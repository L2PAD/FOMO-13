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
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #EEEEEE;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 28px;
  align-items: flex-start;
`
export const ActionsWrapper = styled.div`
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 16px 0 0 16px;
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

export const HeaderSwitchWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
`

export const SwitchButton = styled.button<{active: boolean}>`
  border: none;
  padding: 8px 10px;
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({active}) => active ? 'var(--color-primary)' : 'rgba(115, 128, 148, 0.5)'};
  background: ${({active}) => active ? 'rgba(0, 192, 153, 0.1)' : 'rgba(115, 128, 148, 0.05)'};
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