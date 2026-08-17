import styled from 'styled-components';

export const ModalRow = styled.div`
  margin-top: 20px;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;

    color: var(--color-text-primary);
  }
`

export const AddButton = styled.button`
  background: none;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: #05C9A1;
`

export const FlagRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  
  span  {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }
  
  input {
    background: #F8F8F9;
    border-radius: 8px;
    padding: 10px;
    width: 252px;
    border: none;
    margin-bottom: 8px;
    
    &:first-child {
      width: 224px;
    }
    &:last-child {
      width: 39px;
    }
  }
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
    color: var(--color-text-primary);
  }
`

export const Total = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
  margin-top: 12px;
`