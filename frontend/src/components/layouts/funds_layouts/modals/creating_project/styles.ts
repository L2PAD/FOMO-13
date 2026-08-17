import styled from 'styled-components';
import Button from '../../../../common/button';

export const ProgressWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

export const ProgressNumber = styled.div<{defaultValue: number, value: number}>`
    width: 32px;
  height: 32px;
  border: 2px solid ${({value, defaultValue}) => value >= defaultValue ? 'var(--color-primary)' : 'rgba(115, 128, 148, 0.15)'};
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: 17px;
  line-height: 21px;
  color: ${({value, defaultValue}) => value >= defaultValue ? 'var(--color-primary)' : 'rgba(115, 128, 148, 0.15)'};
  position: relative;
  
  &:not(:last-child)::after {
    position: absolute;
    right: -255px;
    content: ' ';
    background: ${({value, defaultValue}) => value > defaultValue ? 'var(--color-primary)' : 'rgba(5, 201, 161, 0.1)'};
    border-radius: 8px;
    height: 4px;
    width: 245px;
  }
`

export const NextStepButton = styled(Button)`
  width: 100%;
  margin-top: 46px;
`

export const PreviousStepButton = styled.button`
  width: 100%;
  margin-top: 24px;
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`

export const ModalRow = styled.div`
  margin-top: 20px;
`

export const StatusWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }
`

export const LogoWrapper = styled.div`
  margin-top: 20px;
  
  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  
  & > div {
    display: flex;
    gap: 12px;
  }
  
  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    border: none;
    background: none;
  }
`

export const LogoImage = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 8px;
  background: #F8F8F9;
`

export const FundingWrapper = styled.div`
  margin-top: 20px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`

export const InvestorsHeader = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: #05C9A1;
    border: none;
    background: none;
  }

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }`

