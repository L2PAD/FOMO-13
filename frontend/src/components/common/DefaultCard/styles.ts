import styled from "styled-components";
import Typography from "../typography";

export const CardWrapper = styled.div`
  width: 289px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  &:hover{
    opacity:0.8;
  }
  &:active{
    opacity:0.5;
  }
  .buttons {
    display: none;
    width: 100%;
    padding-top: 12px;
    gap: 12px;
    margin-bottom: -10px;

    button {
      width: 100%;

      &.secondary {
        background-color: var(--color-primary)1A;
        color: var(--color-primary);
      }
    }
  }
`
export const HeaderWrapper = styled.div`
  display: flex;
  margin-bottom: 6px;
  gap: 10px;
  align-items: center;
`
export const HeaderInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: calc(100% - 62px);
`
export const HeaderTagWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
`
export const HeaderPrice = styled(Typography)`
  color: var(--color-text-primary);
  font-size: 12px;
  line-height: 14px;
  font-weight: var(--font-weight-medium);
  
  span {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
  }
`
export const HeaderCircle = styled.div`
  min-width: 16px;
  max-width: 16px;
  min-height: 16px;
  border-radius: 8px;
  background: rgba(115, 128, 148, 0.5);
`
export const TitleWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`
export const TitleText = styled(Typography)`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
  width: 162px;
  color: var(--color-text-primary);
`
export const FullTitle = styled(Typography)`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29px;
  color: var(--color-text-primary);
  width: 139px;
`
export const PercentText = styled.span`
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 20px;
`
export const DescriptionWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`
export const DescriptionText = styled(Typography)`
  font-size: 14px;
  line-height: 16px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  width: 116px;
`
export const BodyWrapper = styled.div`
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
`
export const InvestorsWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`
export const InvestorsText = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }
`
export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
`
export const FooterItem = styled(Typography)`
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`
export const ResultWrapper = styled.div`
  margin-top: 13px;
  display: flex;
  gap: 15px;
`
export const ResultItem = styled(Typography) <{ amount?: number }>`
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;

  span {
    color: ${({ amount }) => amount || 0 < 1 ? 'var(--color-danger)' : amount || 0 > 1 && amount || 0 < 2 ? 'var(--color-text-primary)' : 'var(--color-primary)'};
    font-weight: var(--font-weight-semibold);
  }
`

export const AllocSize = styled.div`
  background: rgba(5, 201, 161, 0.05);
  color: rgba(5, 201, 161);
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
  border-radius: 8px;
  padding: 4px 6px;
  width: max-content;
  display: flex;
  flex-direction: column;
  align-items: end;
`
