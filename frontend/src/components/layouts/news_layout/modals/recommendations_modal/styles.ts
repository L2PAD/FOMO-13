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
`

export const RecGrid = styled.div`
  margin-top:25px;
  width:100%;
  display:flex;
  flex-wrap:wrap;
  gap:15px;
`

export const RecItem = styled.button`
  position:relative;
  background:transparent;
  border:none;
  transition:0.3s ease;
  &:hover{
    opacity:0.7;
  }

  img{
    max-width:370px;
    height:225px;
    object-fit:cover;
  }
`

export const AddedItem = styled.div`
  position:absolute;
  top:0;
  left:0;
  right:0;
  bottom:0;

  background:rgba(0, 0, 0, 0.25);
  display:flex;
  align-items:center;
  justify-content:center;
  svg{
  }
`

export const RecItemTitle  = styled.div`
  font-size:22px;
  font-weight: var(--font-weight-semibold);
  margin:10px 5px;
  text-align:left;
`