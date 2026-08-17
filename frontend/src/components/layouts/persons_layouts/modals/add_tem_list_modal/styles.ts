import styled from 'styled-components';

export const SearchWrapper = styled.div`
  position: relative;
  margin-top: 16px;

  & > svg {
    position: absolute;
    bottom: 5px;
    left: 12px;
  }
`

export const SearchInput = styled.input`
  border: 1px solid #F3F4F6;
  border-radius: 8px;
  padding: 8px 12px 8px 35px;
  width: 100%;

'&::placeholder': {
  margin-top: 10px;
  color: rgba(115, 128, 148, 0.5);
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
}
`

export const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  width: 100%;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px 13px 16px 10px;
  margin-top: 7px;
  
  &:first-child {
    margin-top: 12px;
  }
`

export const UserData = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;

  img {
    width: 32px;
    height: 32px;
    border-radius: 100px;
  }
`

export const UsersWrapper = styled.div`
  max-height: 300px;
  overflow-y: auto;
`