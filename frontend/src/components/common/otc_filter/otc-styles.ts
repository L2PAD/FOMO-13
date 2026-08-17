import styled from "styled-components";

export const OtcFilterWrapper = styled.div`
  position: relative;
`

export const OtcDropdown = styled.div<{ active: boolean, right?: boolean }>`
  display: flex !important;
  gap: 80px;
  left: ${({ right }) => right ? '-140px' : 0};;
  display: ${({ active }) => active ? 'block' : 'none'};
  & .otc-checkbox.checkboxes{
    max-width: 300px;
    width: 100%;
    display: grid;
    grid-template-columns:  1fr 1fr;

    &.risk {
      grid-template-columns:  1fr 1fr 1fr;
    }
  }

`

export const OtcDropdownWrapper = styled.div<{variant:'big' | 'small'}>`
  background: white;
  border-radius: 8px;
  width: ${({variant}) => variant === 'small' ? '100%' : 'auto'};

  & > div{
    padding-bottom: 15px !important;
  }
`

export const Buttons = styled.div`
max-width: 390px;
width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;

  button{
    width: 50% !important;
  }
`

export const ResetWrapper = styled.div<{variant:'big' | 'small'}>`
  max-width: fit-content;
  margin-top: ${({variant}) => variant === 'small' ? '14px' : 0};

  button{
    width: 180px;
    background: #F8F8F9;
    color: var(--color-text-muted);

    &:hover{
      background: var(--input-hover);
      color: var(--color-text-muted);
    }
    &:active{
      background: var(--input-active);
      color: var(--color-text-muted);
    }
  }
`


export const OtcColumn = styled.div`
  width: 100%;
  margin-top: 50px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 35px;
`

export const OtcBottom = styled.div<{variant:'small' | 'big'}>`
  margin-top: 20px;
  display: ${({variant}) => variant === 'big' ? 'grid' : 'flex'};
  grid-template-columns: 1fr 0.05fr;
  flex-direction: ${({variant}) => variant === 'big' ? 'none' : 'column'};
  width: ${({variant}) => variant === 'small' ? '100%' : 'auto'};
  gap: ${({variant}) => variant === 'small' ? '0px' : '0'};

  align-items: center;
`