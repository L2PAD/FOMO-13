import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import PersonCard from "../../../../global/PersonCard";
import BaseCard from "../../../../global/common/BaseCard";
import { Button } from "../../../../global/common/Button";
import Tabs from "../../../../global/Tabs";
import {
  ProfilePageShell,
  profileDarkMetricItemStyles,
  profileDarkMetricsGridStyles,
  profileMetricItemStyles,
  profileMetricsGridStyles,
} from "../../shared/ProfilePageShell";
import {
  HeaderWrapper as MarketHeaderWrapper,
  LeftHeaderPersonInfoWrapper as MarketHeaderInfoWrapper,
} from "../../Crypto/Project/crypto-styles";

export const PageWrapper = styled(ProfilePageShell)``;

export const HeaderWrapper = styled(MarketHeaderWrapper).attrs({
  className: "market-project-header market-project-header-full",
})`
  position: relative;
`;

export const HeaderInfoWrapper = styled(MarketHeaderInfoWrapper).attrs({
  className: "market-project-primary-panel",
})`
  && {
    display: grid;
    width: 100%;
    min-width: 0;
    grid-template-columns: minmax(0, 1.85fr) minmax(300px, 1fr);
    align-items: start;
    gap: 24px;
  }

  @media (max-width: 1024px) {
    && {
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
    }
  }

  @media (max-width: 768px) {
    && {
      gap: 14px;
    }
  }
`;

export const HeaderUserInfoWrapper = styled.div`
  display: flex;
  min-width: 0;
  gap: 16px;
  align-items: center;

  > div:last-child {
    min-width: 0;
  }

  @media (max-width: 768px) {
    box-sizing: border-box;
    width: 100%;
    gap: 12px;
    padding-right: 76px;

    > div:last-child {
      flex: 1 1 0;
      overflow: hidden;
    }
  }
`;

export const HeaderInfo = styled.div`
  min-width: 0;
`;

export const HeaderBanner = styled.div`
  max-width: 100%;
  margin-top: 5px;
  overflow-wrap: anywhere;
  color: rgba(211, 211, 215, 0.92);
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 24px;

  @media (max-width: 768px) {
    margin-top: 3px;
    font-size: 15px;
    line-height: 18px;
  }
`;

export const HeaderUserName = styled.div`
  display: flex;
  min-width: 0;
  gap: 10px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 38px;
  line-height: 44px;
  color: var(--color-text-inverse);

  > p {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    font-size: 26px;
    line-height: 31px;
    flex-direction: row;
    align-items: flex-start;
    gap: 6px;
    flex-wrap: wrap;

    & > p,
    & > input {
      width: 100%;
      text-align: left;
    }
  }

  @media (max-width: 480px) {
    font-size: 22px;
    line-height: 26px;
  }
`;

export const RatingCircleWrapper = styled.div`
  margin-top: -10px;
`;

export const HeaderUserDescriptionWrapper = styled.div`
  margin-top: 4px;
  display: flex;
  gap: 12px;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: rgba(255, 255, 255, 0.68);

  @media (max-width: 768px) {
    font-size: 16px;
    line-height: 19px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 17px;
    justify-content: center;
  }
`;

export const HeaderDataWrapper = styled.div`
  ${profileMetricsGridStyles}
  ${profileDarkMetricsGridStyles}
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    &:has(input) {
      grid-template-columns: 1fr;
    }
  }
`;

export const HeaderItem = styled.div`
  ${profileMetricItemStyles}
  ${profileDarkMetricItemStyles}
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }

  & .value {
    display: flex;
    min-width: 0;
    gap: 4px;
    align-items: center;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29.4px;

    @media (max-width: 768px) {
      font-size: 20px;
      line-height: 24px;
    }

    @media (max-width: 480px) {
      font-size: 18px;
      line-height: 22px;
    }

  }

  & .key {
    font-size: 14px;
    color: var(--main-gray);

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }

  @media (max-width: 768px) {
    & .fund-category-list {
      right: auto;
      left: 0;
    }
  }

  &.small-item {
    gap: 0px;

    & .value {
      font-size: 14px;

      & .region-value {
        color: var(--main-black);
      }
    }
  }
`;

export const CurrentRoiValue = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-primary);
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 20px;
    line-height: 24px;
  }
`;

export const CurrentRoiDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 15px;
  }
`;

export const ActionsWrapper = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 12px;
  }
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  svg {
    height: 30px;
    width: 30px;

    @media (max-width: 768px) {
      height: 24px;
      width: 24px;
    }
  }
`;

export const HeaderDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: inherit !important;
  margin-left: 12px !important;

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
    margin-left: 0 !important;
  }

  span {
    color: var(--color-text-muted);
  }
`;
export const PersonCardWrapper = styled(PersonCard)`
  height: 100%;
`;

export const FlagsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 68px;

  @media (max-width: 768px) {
    margin-top: 40px;
  }
`;

export const FlagsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 22px;
  }
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
  margin-left: 20px;

  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
  }
`;

export const FlagsListTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  margin-bottom: 12px !important;

  @media (max-width: 768px) {
    font-size: 15px;
    line-height: 18px;
  }
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

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 15px;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

export const CommentsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 22px;
  }
`;

export const CommentsContent = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const CommentsItems = styled(BaseCard)`
  overflow-y: auto;
  max-height: 320px;
  width: 50% !important;
  padding-top: 0 !important;

  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;

export const AddNewCommentsWrapper = styled(BaseCard)`
  width: 50% !important;
  height: max-content;

  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;

export const NewCommentTextarea = styled.textarea`
  resize: none;
  background: #f8f8f9;
  border-radius: 8px;
  border: none;
  width: 100%;
  height: 160px;
  padding: 9px 12px;
  margin-bottom: 20px;
`;

export const NewCommentButton = styled(Button)`
  width: 100%;
  padding: 13px !important;
`;

export const ParticipatedAction = styled.button<{ rotate: boolean }>`
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 2px 2px 0 #eeeeee;
  border-radius: 8px;
  padding: 8px;
  font-size: 0;
  margin-top: -5px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  svg {
    width: 16px;
    height: 16px;
    transform: ${({ rotate }) => (rotate ? "rotate(45deg)" : "")};
  }
`;

export const ProjectsContentWrapper = styled.div`
  position: relative;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const ProjectContentTabsWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  border-bottom: 1px solid rgba(83, 98, 124, 0.07);
  margin-bottom: 14px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

export const CustomTabs = styled(Tabs)`
  border-bottom: none !important;

  @media (max-width: 768px) {
    overflow-x: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const ProjectFiltersWrapper = styled.div`
  position: absolute;
  right: 0;

  @media (max-width: 768px) {
    position: static;
    margin-top: 10px;
  }
`;

export const HeaderLeftWrapper = styled.div`
  display: flex;
  min-width: 0;
  gap: 10px;
  width: 100%;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }
`;

export const BottomPage = styled.div`
  margin-top: 20px;
  margin-left: auto;
  max-width: fit-content;

  @media (max-width: 768px) {
    margin: 20px auto 0;
    width: 100%;
    display: flex;
    justify-content: center;

    button {
      width: 100%;
      max-width: 300px;
    }
  }
`;
