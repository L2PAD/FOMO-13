import styled from 'styled-components';

export const Wrapper = styled.div`
  position: relative;
`

export const DropdownWrapper = styled.div<{hide: boolean}>`
  position: absolute;
  right: 20px;
  top: -5px;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  min-width: 160px;
  flex-direction: column;
  display:flex;
  transition: all 0.3s;
  opacity: ${({hide}) => hide ? '0' : '1'};
  visibility:${({hide}) => hide ? 'hidden' : 'visible'};
  
  div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    padding: 11px 16px 10px 16px;
    cursor: pointer;
    
    &:first-child {
      padding: 16px 16px 10px 16px;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    
    &:last-child {
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    
  }
`