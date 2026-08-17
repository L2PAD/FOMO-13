import styled from 'styled-components';
import { SearchIcon } from '../../../../../assets';
import { Input } from '../../../../common/components_for_modals/input_with_label/styles';

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 11px;
  margin-top: 16px;
  
  input {
    border: 1px solid #F3F4F6;
    background: none;
    
    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 14px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
  
  label {
    width: calc(100% - 153px) !important;
  }
  
  button {
    background: rgba(5, 201, 161, 0.05);
    border-radius: 8px;
    padding: 6px 14px;
    border: none;
    width: 147px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    transition: .3s;
    
    &:hover {
      background: rgba(4, 165, 132, 0.15);
    }
  }
`

export const FundsWrapper = styled.div`
  max-height: 300px;
  overflow-y: auto;
`

export const FundRow = styled.div<{background:string}>`
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  margin-top: 8px;
  background: ${(props) => props.background};
  
  & > div {
    &:first-child {
      margin-right: 14px;
      svg {
        width: 16px;
      }
    }
    &:last-child {
      margin-left: 18px;
    }
  }
  
  &:hover{
    background: rgba(115,128,148,0.1);
  }
`

export const FundDataWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-primary);
    width: 130px;
  }
`

export const ProjectsWrapper = styled.div`
  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-top: 4px;
    
    span {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: var(--color-primary);
    }
  }
`

export const SubmitButton = styled.button`
  background: var(--color-primary);
  border-radius: 8px;
  margin-top: 19px;
  border: none;
  width: 100%;
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  transition: .3s;
  
  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;
  path {
    fill: rgba(115, 128, 148, 0.5);
  }
`
