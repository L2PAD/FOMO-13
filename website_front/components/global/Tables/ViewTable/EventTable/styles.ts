import styled from "styled-components";
import UserAvatar from "../../../common/UserAvatar";
import BaseCard from "../../../common/BaseCard";
import Typography from "../../../common/Typography";

export const BigAvatar = styled(UserAvatar)`
  width: 24px !important;
`;

export const TableWrapper = styled.div`
  width: 1200px;
  overflow-x: auto;
`;
export const CardsWrapper = styled.div`
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
export const CardWrapper = styled(BaseCard)`
  width: 1190px;
  align-items: center;
  display: flex;
  padding: 16px;
  cursor: pointer;
`;
export const AssetWrapper = styled.div`
  width: 205px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const ProjectTitleWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;

  span {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
`;
export const ProjectTitle = styled(Typography)`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  max-width: 112px;
`;
export const ProjectPercentage = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`;
export const ProjectDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;
export const SupplyWrapper = styled.div`
  width: 133px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  padding-right: 10px;
  box-sizing: border-box;

  span {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
  }
`;
export const PublicWrapper = styled.div`
  width: 177px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const SeedWrapper = styled.div`
  width: 206px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const PrivateWrapper = styled.div`
  width: 400px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  padding-right: 10px;
  box-sizing: border-box;
  display: flex;
  gap: 9px;
`;
export const TimerItem = styled.div`
  display: flex;
  flex-direction: column;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
  }
`;
export const StrategicWrapper = styled.div`
  width: 90px;
  padding-right: 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
`;
export const ResultItem = styled(Typography)<{ amount?: number }>`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;

  span {
    color: ${({ amount }) =>
      amount || 0 < 1
        ? "var(--color-danger)"
        : amount || (0 > 1 && amount) || 0 < 2
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
    font-weight: var(--font-weight-semibold);
  }
`;

export const Tag = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-primary);
  padding: 4px 6px !important;
  background: rgba(5, 201, 161, 0.05);
  border-radius: 8px;
  width: max-content !important;
`;
