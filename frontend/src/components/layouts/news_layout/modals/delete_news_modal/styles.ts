import styled from 'styled-components';

export const ModalRow = styled.div`
  display:flex;
  gap:13px;
`

export const NewsBody = styled.div`
  div{
    font-size:20px;
    margin:10px 0;
    font-weight: var(--font-weight-semibold);
  }

  img{
    max-width:324px;
    height:auto;
    object-fit:cover;
  }
`