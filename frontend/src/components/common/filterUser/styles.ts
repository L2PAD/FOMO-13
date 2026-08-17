import styled from 'styled-components';

export const FilterWrapper = styled.div`
  position: relative;
`

export const FilterButton = styled.button`
  padding: 10px 12px;
  background: rgba(0, 192, 153, 0.1);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  p {
    color: var(--color-primary) !important;
  }
  
  @media(max-width: 767px) {
    font-size: 14px;
    line-height: 17px;
    gap: 4px;
    
    svg {
      width: 14px;
    }
  }
`

export const Row = styled.div`
  &:not(:first-child) {
    margin-top: 20px;
  }
  
  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
  }
`

export const CheckboxWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin-top: 8px;
  
  & > div {
    margin-left: 10px;
  }
  
  & > div label {
    display: flex;
    flex-direction: row-reverse;
    gap: 15px;
  }
`

export const DropdownWrapper = styled.div`
  position: absolute;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px;
  width: 237px;
  z-index: 20;
  margin-top: 4px;
`