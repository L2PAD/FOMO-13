import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const CardWrapper = styled(BaseCard)`
  width: 289px !important;

  @media (max-width: 1200px) {
    width: calc(33% - 8px) !important;
  }

  @media (max-width: 900px) {
    width: calc(50% - 8px) !important;
  }

  @media (max-width: 600px) {
    width: 100% !important;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

export const AvatarWrapper = styled.div`
  width: 64px;
  height: 64px;
`;

export const Followers = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);

  span {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

export const UserName = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  width: 178px;
  margin-top: 3px !important;
`;

export const UserDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  width: 178px;
  margin-top: 4px !important;
`;

export const Description = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  span {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

export const DetailsLink = styled.a`
  display: flex;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
  margin-top: 12px;
  gap: 5px;
`;

export const TwitterActionsWrapper = styled.div`
  margin-top: 16px;
  grid-gap: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  @media (max-width: 1250px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 950px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 950px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 635px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;
