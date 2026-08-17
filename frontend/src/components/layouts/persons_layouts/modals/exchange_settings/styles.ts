import styled from 'styled-components';

export const ModalRow = styled.div`
  margin-top: 20px;
`

export const CheckboxWrapper = styled.div`
  margin-top: 20px;
  
    & > p {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: var(--color-text-primary);
      margin-bottom: 10px;
    }
  
  & > div {
    display: flex;
    flex-direction: column;
    gap: 10px;
    
    & div label {
      display: flex;
      flex-direction: row-reverse;
      gap: 15px;
      margin-left: 10px;
    }
  }
`