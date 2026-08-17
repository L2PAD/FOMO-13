import styled from 'styled-components';

export const ModalRow = styled.div`
  margin-top: 20px;
`

export const AddButton = styled.button`
  background: none;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: #05C9A1;
  margin-bottom: 8px;
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
  }
`

export const DeleteButton = styled.div`
  width: 20px;
  height: 20px;
  border: 1px solid var(--color-danger);
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 6px;
  }
`