import styled from 'styled-components';

export const Wrapper = styled.div`
  position: relative;
`
export const Label = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
  margin-bottom: 7px;
`

export const InputValue = styled.div<{active: boolean}>`
  background: #F8F8F9;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  
  svg {
    transform: rotate(${({active}) => active ? 180 : 0}deg);
    transition: .3s;
  }
`

export const DropdownWrapper = styled.div<{active: boolean}>`
  border: 1px solid #F8F8F9;
  background: white;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px 0;
  position: absolute;
  width: 100%;
  z-index: 20;
  display: ${({active}) => active ? 'block' : 'none'};
  
  div {
    cursor: pointer;
    padding: 5px 12px;
    
    &:hover {
      background: #F8F8F9;
    }
  }
`