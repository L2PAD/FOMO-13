import styled from "styled-components";
import Link from "next/link";
import Typography from "../../../../global/common/Typography";
import BaseCard from "../../../../global/common/BaseCard";
import ViewCard from "../../../../global/ViewCard";

export const ProjectCardItem = styled(ViewCard)`
  height: 100% !important;
`;

export const LeftHeaderPersonalWrapper = styled.div`
  display: flex;
  gap: 16px;
`;

export const PersonCurrencyWrapper = styled.div`
  @media (max-width: 767px) {
    display: flex;
    gap: 14px;
    align-items: flex-end;
  }
`;

export const PersonPriceTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 4px !important;
`;

export const PersonMainPrice = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px !important;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-primary);
    padding: 4px 6px;
    background: rgba(5, 201, 161, 0.05);
    border-radius: 8px;
  }
`;

export const PersonPriceCurrency = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
  margin-bottom: 6px !important;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-primary);
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

  @media (max-width: 767px) {
    font-size: 12px;
    line-height: 14px;

    span {
      font-size: 14px;
      line-height: 17px;
    }
    i {
      font-size: 12px;
      line-height: 14px;
    }
  }
`;

export const PageTabsWrapper = styled.div`
  margin-top: 24px;
`;

export const TabsContentWrapper = styled.div`
  margin-top: 24px;
`;

export const TabsWrapper = styled.div`
  width: 1204px;
  margin: 32px auto 0;

  @media (max-width: 1024px) {
    width: 100%;
  }
  @media (max-width: 767px) {
    width: 100%;
    div > div {
      font-size: 14px;
      line-height: 17px;
    }
  }
`;

export const ProgressMinWrapper = styled.div`
  width: 100%;
`;

export const RangeTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
`;

export const RangeWrapper = styled.div`
  position: relative;
  border-radius: 8px;
  height: 8px;
  background: rgb(243, 244, 246);
  margin-top: 8px;
  margin-bottom: 13px;
`;

export const RangeValue = styled.div<{ percentage: number }>`
  background: linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%);
  border-radius: 8px;
  height: 8px;
  width: ${({ percentage }) => percentage}%;
`;

export const RangeDescriptionWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const RangeDescription = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-primary);
  display: flex;
  gap: 10px;

  span {
    color: var(--color-text-muted);
  }
  i {
    color: var(--color-text-primary);
  }
`;

export const CommentsWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CommentsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
`;
export const FlagsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 40px;
`;

export const FlagsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
`;

export const FlagsListsWrapper = styled.div`
  display: flex;
  margin-top: 16px;
  gap: 50px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 32px;
  }
`;

export const FlagsList = styled.div`
  width: 375px;
`;

export const FlagsListTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  margin-bottom: 12px !important;
`;

export const FlagsListItem = styled.li`
  display: flex;
  gap: 6px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: max-content;
  align-items: center;
  margin-bottom: 12px;
`;

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

export const ModalWrapper = styled.div`
  margin-top: -20px;
`;
export const HeaderActionsWrapperMobile = styled.div`
  display: none;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;

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
    display: flex;
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

export const HeaderPersonNameWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 32px;
  margin-top: 10px;
  padding-bottom: 15px;

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
  display: flex;
  gap: 2px;

  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 29px;
  }

  span {
    font-size: 18px;
    line-height: 18px;
    margin-top: 16px;
  }

  b {
    font-size: 24px;
    color: var(--color-text-muted);
    margin-left: 10px;
    line-height: 24px;
    margin-top: 10px;
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

export const HeaderDescriptionItemsWrapperMobile = styled.div`
  display: none;
  gap: 32px;
  margin-top: 10px;

  @media (max-width: 1024px) {
    display: flex;
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

export const ProjectData = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  width: 100%;
  margin-bottom: 20px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

export const ProjectDataWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 17px;
  flex-direction: column;
  width: 100%;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  @media (max-width: 767px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 25px;
  }
`;

export const ProjectDataItem = styled(Typography)<{ percentage?: number }>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
  display: grid;
  grid-template-columns: 1fr 1fr;
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

export const GraphicWrapper = styled(BaseCard)`
  margin: auto;
  width: 100%;
  min-width: 289px;
`;

export const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;

  & > div {
    overflow-x: auto;

    * {
      white-space: nowrap;
    }
  }
`;

export const GraphicHeader = styled.div`
  background: #f8f8f9;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 10px;
  text-align: center;
`;

export const CardHeader = styled.div`
  margin-top: -20px;
  margin-left: -16px;
  margin-right: -16px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 10px;
`;

export const TableHeader = styled.div`
  margin-top: -20px;
  margin-left: -16px;
  margin-right: -16px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 10px;
  background: #f8f8f9;
  border-bottom: 2px solid #f8f8f9;

  p {
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    font-weight: var(--font-weight-medium);
    gap: 5px;
  }

  div {
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;
  }

  small {
    display: block;
    transform: rotate(90deg);
    width: 8px;
    height: 8px;
    font-size: 8px;
  }
`;

export const HeaderItem = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  font-weight: var(--font-weight-medium);
`;

export const GraphicItemsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const GraphicItems = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
`;

export const GraphicItem = styled.div`
  display: grid;
  grid-auto-flow: column;
  padding: 10px;
  grid-template-columns: repeat(4, 1fr);

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }
`;

export const TableItem = styled(Link)<{ count?: number }>`
  display: grid;
  grid-auto-flow: column;
  padding: 10px;
  margin-left: -16px;
  margin-right: -16px;
  grid-template-columns: repeat(${({ count }) => count || 6}, 1fr);

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }
`;

export const CardItem = styled.div`
  display: grid;
  grid-auto-flow: column;
  padding: 10px;
  margin-left: -16px;
  margin-right: -16px;
  grid-template-columns: repeat(5, 1fr);
`;

export const GraphicItemData = styled.div<{
  variant: "default" | "green" | "red" | "bold";
}>`
  color: ${({ variant }) =>
    variant === "red"
      ? "var(--color-danger)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-text-primary)"};
  font-weight: ${({ variant }) => (variant === "default" ? "normal" : "bold")};
  display: flex;
  gap: 5px;

  button svg {
    width: 20px;
    height: 20px;
  }
`;

export const CardIemData = styled.div`
  display: flex;
  font-weight: var(--font-weight-semibold);
  gap: 5px;

  @media (max-width: 500px) {
    font-size: 14px;
  }
`;

export const Colored = styled.div<{
  variant: "default" | "green" | "red" | "gray";
}>`
  color: ${({ variant }) =>
    variant === "red"
      ? "var(--color-danger)"
      : variant === "green"
        ? "var(--color-primary)"
        : variant === "gray"
          ? "var(--color-text-muted)"
          : "var(--color-text-primary)"};
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
export const Wrapper = styled.div`
  margin-left: -16px;
  margin-right: -16px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: 800px) {
    margin-left: 0;
    margin-right: 0;
  }
`;

export const CardWrapper = styled(BaseCard)`
  width: calc(100% - 4px);
  padding-bottom: 0;
  margin-bottom: 4px;

  * {
    gap: 10px;
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

export const CardsWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 5px;

  & > div {
    margin: auto;
  }

  @media (max-width: 1200px) {
    flex-direction: column;

    & > div {
      width: 100%;
    }
  }
`;

export const ChardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 10px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

export const TwoCards = styled(BaseCard)`
  width: 600px;
  padding: 20px 16px;
  display: flex;
  box-shadow: 4px 4px 0px #eeeeee;
  gap: 16px;
  flex-wrap: wrap;

  & > div {
    margin: auto;
    width: 250px;
    min-width: 250px;

    @media (max-width: 600px) {
      width: 100%;
    }
  }
`;
export const Separator = styled.span`
  height: 100%;
  border-right: 1px solid rgba(83, 98, 124, 0.07);
`;

export const BidsItem = styled.div`
  p {
    display: flex;
    gap: 5px;
  }
`;

export const ButtonWraper = styled.div`
  padding: 0 10px;
`;
