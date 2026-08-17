import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import BaseCard from "../../../../global/common/BaseCard";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ShareTagWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

export const ShareTagText = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  gap: 6px;
  span {
    color: var(--color-danger);
  }
  i {
    width: 16px;
    height: 16px;
    background: rgba(115, 128, 148, 0.5);
    border-radius: 8px;
  }
`;

export const ShareButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-primary);
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 32px;
  margin-top: 18px;
  border-bottom: 2px solid #f8f8f9;
  padding-bottom: 24px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;
export const LeftHeaderWrapper = styled.div`
  width: calc(50% - 16px);
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const LeftHeaderPersonInfoWrapper = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 767px) {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

export const HeaderPersonTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);

  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 29px;
  }
`;
export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
`;

export const HeaderPersonDescription = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 2px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const PersonPriceWrapper = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 26px;
  }
`;

export const ProgressWrapper = styled.div`
  width: 100%;
`;
export const RightHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: calc(50% - 16px);

  @media (max-width: 1024px) {
    width: 100%;
  }
  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const RightHeaderHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 1024px) {
    justify-content: flex-start;
    align-items: center;
    gap: 14px;
  }

  @media (max-width: 767px) {
    justify-content: flex-start;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
`;

export const HeaderEditButton = styled.button`
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 2px 2px 0 #eeeeee;
  border-radius: 8px;
  padding: 8px;
  width: 32px;
  height: 32px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const HeaderDataTextWrapper = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

export const HeaderDataText = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 18px;
    line-height: 22px;

    span {
      font-size: 12px;
      line-height: 14px;
    }
  }
`;

export const HeaderActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    background: none;
    border: none;
    cursor: pointer;
    svg {
      width: 30px;
      height: 30px;
    }
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

export const HeaderDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;

    i {
      font-size: 14px;
      line-height: 16px;
    }
  }

  span {
    color: var(--color-text-muted);
  }

  i {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary);
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;

    span,
    i {
      font-size: 14px;
      line-height: 16px;
    }
  }
`;

export const HeaderDescriptionItemsWrapper = styled.div`
  display: flex;
  gap: 32px;
  margin-top: 10px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

export const HeaderDescriptionItemsTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const HeaderCopyKey = styled.div`
  background: #f3f4f6;
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  gap: 8px;
  cursor: pointer;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-top: 3px;
`;

export const HeaderUsersRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const HeaderUserWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 7px;
`;

export const ProjectDescriptionDataWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 64px;
  margin-top: 17px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f8f8f9;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 40px;
  }
  @media (max-width: 767px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 25px;
  }
`;

export const ProjectDescriptionItem = styled(Typography)<{
  percentage?: number;
}>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  gap: 5px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
  }

  i {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: ${({ percentage = 0 }) =>
      percentage > 10
        ? "var(--color-primary)"
        : percentage < 10 && percentage > 0
          ? "var(--color-text-muted)"
          : "var(--color-danger)"};
  }
`;

export const GraphicWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 22px;
  margin-top: 26px;

  @media (max-width: 768px) {
    gap: 2px;
  }
`;

export const GraphicDataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const GraphicRoiDataTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  margin-bottom: 16px !important;
`;

export const GraphicRoiDataContentWrapper = styled.div`
  display: flex;
  gap: 54px;
`;

export const GraphicRoiDataContentItem = styled(Typography)<{ amount: number }>`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    margin-top: 4px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: ${({ amount }) =>
      amount >= 2
        ? "var(--color-primary)"
        : amount >= 1 && amount < 2
          ? "var(--color-text-primary)"
          : "var(--color-danger)"};
  }
`;

export const GraphicStatisticsItem = styled.div`
  padding: 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
    padding: 10px 0;
  }
`;
export const Wrapper = styled(BaseCard)`
  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;
export const GraphicStatisticsItemTitle = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);

  span {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const GraphicStatisticsItemValues = styled.div<{
  variant: "default" | "green" | "red";
}>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  text-align: right;
  color: ${({ variant }) =>
    variant === "default"
      ? "var(--color-text-primary)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-danger)"};
`;
export const NewsWrapper = styled.div`
  width: calc(100% - (100% - 1204px) / 2);
  margin-left: calc((100% - 1204px) / 2);
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 1204px) {
    margin-left: 16px;
  }
`;

export const RatingMediaWrapper = styled.div`
  margin-top: 64px;
`;

export const RatingMediaList = styled.ul`
  margin-top: 16px;
`;

export const RatingMediaListItem = styled.li`
  a {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    display: flex;
    gap: 7px;
    align-items: center;
  }
  &:not(:first-child) {
    margin-top: 12px;
  }
`;
