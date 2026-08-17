import styled from "styled-components";

export const ButtonWrapper = styled.button<{variant: 'confirm' | 'reject', big: boolean,disabled?:boolean}>`
  padding: 6.5px 8px;
  color: ${({variant}) => variant === 'confirm' ? 'var(--color-primary)' : 'var(--color-danger)'};
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #F3F4F6;
  box-shadow: 2px 2px 0px 0px #EEEEEE;
  background: white;

  transition: all 0.3s ease;
  &:hover {
    color: ${({variant}) => variant === 'confirm' ? '#00A07F' : '#E42736'};
    border: 1px solid #E4E4E4
  }
  &:active {
    box-shadow: 1px 1px 0px 0px #C6C6C6;
    border: 1px solid #F3F4F6
  }
  &:disabled{
    color: ${({variant}) => variant === 'confirm' ? 'var(--color-primary)' : 'var(--color-danger)'};
    border: 1px solid #F3F4F6;
    box-shadow: 2px 2px 0px 0px #EEEEEE;
    color: #A0A0A0;
    cursor: not-allowed;
  }
`

export const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

`
    /* background: ${({variant}) => }; */
