import styled from "styled-components";
import Typography from "../typography";
// import DropdownComponent from '../common/Dropdown';

export const FilterWrapper = styled.div`
  position: relative;
  z-index: 5;
`

export const FilterButton = styled.button`
  padding: 10px 12px;
  background: rgba(0, 192, 153, 0.1);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary) ;
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;

  p{
  color: var(--color-primary) ;
  }
  transition: background 0.3s ease;

  &:hover{
    background: rgba(0, 192, 153, 0.2);
  }
  &:active{
    background: rgba(0, 192, 153, 0.35);
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

export const DropdownWrapper = styled.div`
  padding: 20px 16px;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
`

export const Dropdown = styled.div<{ active: boolean, right?: boolean }>`
  padding-top: 5px;
  width: 237px;
  position: absolute;
  z-index: 20;
  top: 40px;
  left: ${({ right }) => right ? '-140px' : 0};;
  display: ${({ active }) => active ? 'block' : 'none'};
`


export const DropdownRow = styled.div`
  display: flex;
  flex-direction: column;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  gap: 10px;
  &:not(:last-child) {
    padding-bottom: 25px;
  }
  .checkboxes {
    display: flex;
    flex-direction: column;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
    gap: 12px;
    &.grid {
      display: grid;
    }
  }
`

export const RangeTitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const RangeTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
`
// export const DropdownCurrency = styled(DropdownComponent)`
//   border: none !important;
//   padding: 0 12px !important;
//   p, span {
//     font-weight: 400 !important;
//     font-size: 14px !important;
//     line-height: 16px !important;
//     color: var(--color-text-primary) !important;
//   }
//   .dropdown-class-name {
//     top: 15px;
//   }
// `

export const InputRowWrapper = styled.input`
  padding: 11px 12px;
  background: #F8F8F9;
  border-radius: 8px;
  border: none
`

export const Overlay = styled.div`

  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
` 

