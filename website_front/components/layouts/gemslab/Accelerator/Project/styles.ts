import styled from "styled-components";
import Link from "next/link";
import Typography from "../../../../global/common/Typography";

export const PageWrapper = styled.div`
  width: 1240px;
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

export const ShareButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 16px;
  color: var(--color-info);
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
  margin-top: 48px;
  padding-bottom: 24px;

  @media (max-width: 1024px) {
    flex-direction: column;
    padding-bottom: 18px;
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
    display: none;
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

export const RatingCircleWrapper = styled.div`
  margin-top: -10px;
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

  @media (max-width: 1024px) {
    justify-content: center;
  }
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

export const ContentWrapper = styled.div`
  margin-top: 24px;
`;

export const RoundsWrapper = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 767px) {
    flex-direction: column;
  }
`;

export const PublicWrapper = styled.div`
  background: #f8f8f9;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px;
  width: 320px;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const StrongWrapper = styled.div`
  background: rgba(0, 192, 153, 0.05);
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px;
  width: 320px;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const RoundTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  margin-bottom: 8px !important;
`;

export const RoundDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  white-space: normal !important;

  a {
    color: var(--color-primary);
  }
`;

export const RoundTimerWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const RoundTimerTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
`;

export const RoundTimerValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
`;

export const DatesWrapper = styled.div`
  width: 623px;
  margin: 32px auto 0;
  display: grid;
  grid-template-columns: 1fr 1fr auto;

  span {
    color: var(--color-text-muted);
  }
`;
export const StagesWrapper = styled.div`
  width: 623px;
  margin: 32px auto 0;
  display: grid;
  grid-template-columns: 1fr 1fr auto;

  span {
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .stage {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .num {
    background: #eeeeee;
    color: var(--color-text-muted)80;
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;

    &.active {
      background: #05c9a1;
      color: var(--color-white);
    }
  }
`;

export const ProjectContentWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 32px auto 0;
  flex-direction: column;
  width: 623px;

  img {
    width: 100%;
    height: auto;
    margin-bottom: 37px;
  }

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const ProjectContentDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);
  white-space: normal !important;
`;

export const FactsWrapper = styled.div`
  margin-top: 40px;
`;

export const FactsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
  margin-bottom: 11px !important;
`;

export const FactRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 13px;
  div {
    &:first-child {
      text-align: right;
      width: 166px;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
    }
    &:last-child {
      width: calc(100% - 178px);
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: var(--color-text-primary);
    }
  }
`;

export const ProjectDescriptionActionsWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 32px;
`;

export const PrimaryButton = styled(Link)`
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  padding: 13px;
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  transition: 0.3s;

  &:hover {
    color: var(--color-primary);
    background: var(--color-primary-soft);
  }
`;

export const SecondaryButton = styled(Link)`
  background: var(--color-primary-soft);
  border-radius: 8px;
  border: none;
  padding: 13px;
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  transition: 0.3s;

  &:hover {
    color: var(--color-white);
    background: var(--color-primary);
  }
`;

export const StepsWrapper = styled.div`
  max-width: fit-content;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  @media (max-width: 780px) {
    max-width: 100%;
    flex-direction: column;
    justify-content: flex-start;
    gap: 12px;
  }
`;

export const StepItemWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  & div {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &:nth-child(1)::after {
    content: "";
    display: block;
    width: 34px;
    height: 2px;
    background: var(--color-text-muted);
    margin: 0px 15px 0px 5px;
  }
  &:nth-child(2)::after {
    content: "";
    display: block;
    width: 34px;
    height: 2px;
    background: var(--color-text-muted);
    margin: 0px 15px 0px 5px;
  }
  @media (max-width: 780px) {
    &:nth-child(1)::after {
      content: "";
      display: none;
    }
    &:nth-child(2)::after {
      content: "";
      display: none;
    }
  }
`;

export const StepKey = styled.span`
  font-family: "Gilroy";
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 19.81px;
  color: #0d0f2b;
`;

export const StepValue = styled.span`
  font-family: "Gilroy";
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 19.81px;
  color: var(--color-text-muted);
`;

export const HeaderProjectList = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ProjectStatusTag = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 14.09px;
  color: white;
  background: var(--color-info);
  border-radius: 8px;
  padding: 4px 5px;
`;

export const ProjectHeaderWrapper = styled.div`
  font-family: "Gilroy";
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16.24px;
  text-align: left;
  color: var(--color-text-muted);

  & span {
    color: var(--color-primary);
    margin-right: 4px;
  }
`;

export const ProjectBodyWrapper = styled.div`
  margin-top: 34px;
  display: flex;
  justify-content: space-between;
  @media (max-width: 880px) {
    flex-direction: column-reverse;
    gap: 20px;
  }
`;

export const ProjectDetails = styled.div`
  display: flex;
  gap: 25px;
`;

export const ProjectDetailsItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ProjectDetailsTitle = styled.div`
  font-family: "Gilroy";
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29.02px;
  color: var(--color-text-primary);
`;

export const ProjectDetailsDescription = styled.div`
  font-family: "Gilroy";
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16.24px;
  color: var(--color-text-muted);
`;

export const SectionsBtns = styled.div`
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 20px;
`;
export const SectionBtn = styled.button<{ selected: boolean }>`
  color: ${({ selected }) => (selected ? "#131316" : "#808894")};
  box-shadow: ${({ selected }) =>
    selected ? "0px 4px 1px -1px var(--color-primary)" : "0px 0px 0px 0px"};
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 0;
  padding-bottom: 16px;
  background: transparent;
  border: none;
  @media (max-width: 550px) {
    padding: 0px 10px 16px;
  }
`;

export const SectionLine = styled.div`
  max-width: 1360px;
  width: 100%;
  height: 2px;
  background: #cfd0d3;
  margin: 0.8px 0 0 0;
`;
export const Recommended = styled.div`
  margin-top: 75px;
`;
export const RecommendedList = styled.div`
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;

  @media (max-width: 1250px) {
    justify-content: center;
  }
`;
export const RecommendedTitle = styled.div`
  font-family: "Gilroy";
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  line-height: 39.62px;
  text-align: center;
`;
