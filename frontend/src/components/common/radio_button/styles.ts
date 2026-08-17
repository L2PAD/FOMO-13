import styled from 'styled-components';

export const Wrapper = styled.label<{checked: boolean}>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  
  input {
    display: none;
  }
  
  div {
    width: 16px;
    height: 16px;
    border: 1px solid ${({checked}) => checked ? 'var(--color-primary)' : 'rgba(83, 98, 124, 0.25)'};
    border-radius: 99px;
    position: relative;
    
    span {
      border-radius: 99px;
      width: 8px;
      height: 8px;
      background: var(--color-primary);
      position: absolute;
      z-index: 2;
      top: 3.5px;
      left: 3.5px;
      display: ${({checked}) => checked ? 'block' : 'none'};
    }
  }
`