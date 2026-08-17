import styled from 'styled-components';

export const ModalRow = styled.div`
  margin-top: 20px;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  
  textarea {
    padding: 8px;
    width: 100%;
    height: 90px;
    max-height:200px;
    resize: none;
    border: none;
    background: #F8F8F9;
    border-radius: 8px;
  }
`

export const Input = styled.input`
'opacity':'0',
'position':'absolute',
'left':'0',
'top':'0',
'width':'88px',
'height':'88px',
'cursor':'pointer'
`

export const LabelTest = styled.label`
  'cursor':'pointer',
  'fontFamily': 'Gilroy',
  'fontWeight': '600',
  'fontSize': '14px',
  'lineHeight': '17px',
  'color': 'var(--color-primary)',
`

export const ImageWrapper = styled.div`
'position':'relative',
'display':'flex',
'alignItems':'center',
`

export const TextWrapper = styled.div`
  margin-top: 10px;
  height:500px;
  border: 1px solid rgba(126, 126, 126, 0.204);
`