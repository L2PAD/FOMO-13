import styled from "styled-components";
import UserAvatar from "../../../common/UserAvatar";
import BaseCard from "../../../common/BaseCard";
import Typography from "../../../common/Typography";

export const RangeWrapper = styled.div`
  background: rgba(115, 128, 148, 0.15);
  border-radius: 8px;
`;
export const RangeValue = styled.div<{ percentage: number }>`
  background: linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%);
  border-radius: 8px;
  height: 4px;
  width: ${({ percentage }) => percentage}%;
  margin-top: 4px;
`;

export const BigAvatar = styled(UserAvatar)`
  width: 24px !important;
`;

export const SmallAvatar = styled(UserAvatar)`
  width: 16px !important;
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
  width: 130px;
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
export const ColValue = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);

  span {
    font-size: 12px;
    color: var(--color-text-muted);
  }
`;
export const SupplyWrapper = styled.div`
  width: 144px;
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
  width: 144px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const SeedWrapper = styled.div`
  width: 144px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const PrivateWrapper = styled.div`
  width: 144px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const StrategicWrapper = styled.div`
  width: 144px;
  padding-right: 10px;
  box-sizing: border-box;
`;
export const StageWrapper = styled.div`
  width: 137px;
`;
export const UpcomingWrapper = styled.div`
  width: 102px;
`;
export const LastWrapper = styled.div`
  width: 50px;
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

export const DateValue = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
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
