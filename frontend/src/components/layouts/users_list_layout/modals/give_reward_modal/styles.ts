import styled from 'styled-components';
import Button from '../../../../common/button';

export const ModalRow = styled.div`
  margin-top: 20px;
`

export const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: 24px;
`

export const UsersRow = styled.div`
  margin-top: 20px;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
`