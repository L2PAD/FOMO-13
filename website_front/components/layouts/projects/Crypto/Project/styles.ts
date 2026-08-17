import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import {
  BaseCardCryptoWrapper,
  BaseCardWrapper,
} from "../../../../global/common/BaseCard/styles";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 32px auto 0;

  ${BaseCardWrapper},
  ${BaseCardCryptoWrapper} {
    background: rgb(255, 255, 255);
    border: 1px solid var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    border-radius: 12px;
  }

  ${BaseCardWrapper}:hover,
  ${BaseCardCryptoWrapper}:hover {
    background: rgb(255, 255, 255);
    border-color: var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    transform: none;
  }

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

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  &.entity-actions-header {
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    & .edit-btn {
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      border: none !important;
      position: absolute;
      top: 20px;
      right: 64px;
      z-index: 2;

      span {
        display: none;
      }

      svg {
        width: 24px !important;
        height: 24px !important;
      }
    }
  }

  & .green-btn {
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    gap: 8px;
    border: 1px solid var(--main-green);
    width: 120px;
    span {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 100%;
      color: var(--main-green);
    }

    @media (max-width: 480px) {
      width: 100%;
      padding: 8px 12px;
    }
  }
`;

export const ProjectHeaderBlockWrapper = styled.div`
  width: 100%;
  background: var(--color-white);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 14px;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }
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
  margin-top: 10px;
  padding: 24px;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 14px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }
`;

export const HeaderActionsWrapperMobile = styled.div`
  display: none;
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
    display: flex;
  }
`;

export const LeftHeaderPersonInfoWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  @media (max-width: 1024px) {
    justify-content: space-between;
  }

  @media (max-width: 767px) {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

export const LeftHeaderPersonalWrapper = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 767px) {
    .edit-state {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
  }
`;

export const HeaderPersonTitle = styled(Typography)`
  display: flex;
  gap: 20px;
  align-items: center;
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

export const PersonPriceWrapper = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 26px;
  }
`;

export const PersonCurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--main-gray);
  }
`;

export const PriceInfo = styled.div`
  margin-left: auto;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19.6px;
`;

export const EditWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
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
  font-size: 16px;
  line-height: 19px;
  color: var(--main-black);
  display: flex;
  align-items: center;
  gap: 5px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-primary);
    padding: 4px 6px;
    background: rgba(5, 201, 161, 0.05);
    border-radius: 8px;
  }

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: #e42736;
    padding: 4px 6px;
    background: #e4273710;
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

export const ProgressWrapper = styled.div`
  width: 100%;
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
    justify-content: space-between;
    flex-direction: row;
    align-items: flex-start;
    gap: 14px;

    &.edit-state {
      flex-direction: column !important;
      align-items: flex-start !important;
      width: 100%;
      padding-top: 12px;
      gap: 14px;

      & div,
      & input {
        width: 100% !important;
      }
    }
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
  margin-right: 12px;
  svg {
    width: 16px !important;
    height: 16px !important;
  }
`;

export const EditStateWrapper = styled.div<{ isLeftIcon?: boolean }>`
  position: relative;
  width: fit-content;
  & .left-icon {
    position: absolute;
    top: 9px;
    left: 6px;
  }

  & .right-icon {
    position: absolute;
    top: 9px;
    right: 10px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
  }
  input {
    padding: ${({ isLeftIcon }) =>
      isLeftIcon ? "4px 8px 4px 18px" : "4px 8px"};
    height: 38px;
    border-radius: 6px;
    background: var(--input-edit-bg);
    border: none;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);

    &::placeholder {
      color: var(--color-text-muted);
      font-weight: var(--font-weight-regular);
    }
    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }

  textarea {
    max-width: 590px;
    height: 52px;
    width: 100%;
    padding: 4px 8px;
    border-radius: 6px;
    background: var(--input-edit-bg);
    border: none;
    transition: all 0.3s ease;
    font-size: 14px;

    &::placeholder {
      color: var(--color-text-muted);
    }
    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }

  & .date-input::-webkit-calendar-picker-indicator {
    display: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const HeaderDataTextWrapper = styled.div`
  margin-top: 17px;
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
  gap: 6px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--main-gray);
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
  align-items: center;
  gap: 32px;
  margin-top: 10px;

  & > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  @media (max-width: 768px) {
    margin-top: 0;
    &.edit-state {
      flex-direction: column !important;
      align-items: flex-start !important;
      width: 100%;
      padding-top: 12px;
      gap: 14px;

      & div,
      & input {
        width: 100% !important;
      }
    }
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

export const HeaderDescriptionItemsTitle = styled.div`
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
    color: ${({ percentage = 0 }) => {
      if (percentage > 10) return "var(--color-primary)";
      if (percentage > 0) return "var(--color-text-muted)";
      return "var(--color-danger)";
    }};
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
export const NewsWrapper = styled.div`
  width: calc(100% - (100% - 1204px) / 2);
  margin-left: calc((100% - 1204px) / 2);
  display: flex;
  flex-direction: column;
  gap: 10px;
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

export const PageTabsWrapper = styled.div`
  margin-top: 24px;
`;

export const TabsContentWrapper = styled.div`
  margin-top: 14px;
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
  flex-direction: column;
  margin-top: 16px;
  gap: 20px;

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
  gap: 8px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: max-content;
  align-items: center;
  margin-bottom: 12px;

  span {
    display: block;
    max-width: 360px;
  }
`;

export const ShareHeadWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const EditBtnsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 12px;
`;

export const ProjectDatePicketWrapper = styled.div`
  button {
    max-width: 120px;
  }
`;

export const SponsoredWrapper = styled.div`
  padding: 4px 16px;
  background: var(--color-info)0d;
  font-size: 12px;
  color: var(--color-info);
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  height: 22px;
  font-weight: var(--font-weight-regular);

  @media (max-width: 480px) {
    padding: 3px 12px;
    font-size: 11px;
    height: 20px;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const BottomActions = styled.div`
  margin-top: 40px;
  margin-left: auto;
  max-width: fit-content;

  @media (max-width: 768px) {
    margin-top: 30px;
    margin-left: 0;
    width: 100%;
  }
`;
