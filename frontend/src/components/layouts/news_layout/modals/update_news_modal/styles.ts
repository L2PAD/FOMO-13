import styled from 'styled-components';

export const ModalRow = styled.div`
  margin-top: 20px;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }
  
  textarea {
    padding: 8px;
    width: 100%;
    height: 200px;
    resize: none;
    border: none;
    background: #F8F8F9;
    border-radius: 8px;
  }

  button{
    margin-top:20px;
  }
`

export const RecRow = styled.div`
  max-width:100%;
  width:100%;
  overflow:hidden;
`

export const TextWrapper = styled.div`
  margin-top: 10px;
  height:500px;
  border: 1px solid rgba(126, 126, 126, 0.204);
`