import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import UserAvatar from "../../../global/common/UserAvatar";
import { Button } from "../../../global/common/Button";

export const PageWrapper = styled.div`
  margin: 27px auto 0;
  width: 1204px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  gap: 32px;
  justify-content: space-between;
  width: 100%;
  margin-top: 16px;
`;

export const ImageWrapper = styled.div`
  width: 50%;
  height: auto;

  img {
    width: 100%;
    height: auto;
  }
`;

export const NFTDataWrapper = styled.div`
  width: 50%;
`;

export const AuthorWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  margin-bottom: 12px;
`;

export const NFTNameWrapper = styled.div`
  display: flex;
  gap: 9px;
  align-items: center;
`;

export const NFTName = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);
`;

export const NFTTag = styled.div`
  background: rgba(115, 128, 148, 0.1);
  border-radius: 8px;
  padding: 4px 10px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
`;

export const DataDescription = styled(Typography)`
  margin-top: 8px !important;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  span {
    background: none;
    border: none;
    color: var(--color-primary);
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
    cursor: pointer;
  }
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
`;

export const ActionsUserWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const ActionsUser = styled(UserAvatar)`
  width: 40px !important;
  height: 40px !important;
`;

export const ActionsUserTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  i {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 16px;
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    color: var(--color-text-primary);
  }
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

export const BuyButton = styled(Button)`
  width: 50%;
  padding: 13px !important;
  font-weight: var(--font-weight-semibold) !important;
  font-size: 18px !important;
  line-height: 22px !important;
  color: var(--color-white) !important;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;

export const OrderButton = styled.button`
  background: var(--color-primary-soft);
  border-radius: 8px;
  padding: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  border: none;
  width: 50%;
  transition: 0.3s;

  &:hover {
    background: rgba(4, 165, 132, 0.15) !important;
  }
`;
