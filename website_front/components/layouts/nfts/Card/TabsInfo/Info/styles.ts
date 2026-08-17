import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const Wrapper = styled(BaseCard)`
  width: 320px !important;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
`;

export const PersonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 14px;
  color: var(--color-text-primary);
  margin-top: 19px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f8f8f9;
`;

export const InfoItem = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 !important;
  border-bottom: 2px solid #f8f8f9;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
  }
`;
