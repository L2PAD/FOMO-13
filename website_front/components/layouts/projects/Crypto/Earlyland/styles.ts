import styled from "styled-components";
import { TabsLeft as SpaceportTabsLeft } from "../../../spaceport/styles";

export {
  HeaderWrapper,
  TitleWrapper,
  TabButton,
  PageContentWrapper,
  MobileDropdownWrapper,
  MobileDropdownTrigger,
  MobileDropdownMenu,
  MobileDropdownOption,
} from "../../../spaceport/styles";

export const TabsLeft = styled(SpaceportTabsLeft)`
  /* Right-side view switch (Tasks | Board) sits at its original compact size:
     it should hug its two tabs instead of stretching across the header. */
  &.earlyland.right {
    min-width: auto;

    button {
      width: auto;
      white-space: nowrap;
    }

    @media (max-width: 1120px) {
      min-width: auto;
    }
  }
`;

export const NftAccessWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
  position: relative;
  cursor: pointer;

  & > svg {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: block;
  }

  &:hover > span.nft-tooltip {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
`;

export const NftTooltipBox = styled.span`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
  width: 260px;
  background: var(--color-white);
  border-radius: 8px;
  box-shadow: 2px 4px 20px 0px rgba(7, 11, 53, 0.12);
  padding: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 20px;
  color: #728094;
  text-align: left;
`;

export const NftAccessText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;

  .nft-title {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 20px;
  }

  .nft-subtitle {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
    line-height: 18px;
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;

  @media (max-width: 1120px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

export const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .ad {
    & > a {
      min-width: max-content;
    }
  }

  @media (max-width: 1120px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

export const TabTooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
  width: 100%;

  &:hover > div {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
`;

export const TabTooltipBox = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 200;
  width: 340px;
  background: var(--color-white);
  border-radius: 8px;
  box-shadow: 2px 4px 20px 0px rgba(7, 11, 53, 0.12);
  padding: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;

  p {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 20px;
    color: #728094;
    margin: 0 0 8px;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      font-weight: var(--font-weight-semibold);
      color: #728094;
    }
  }
`;

export const DesktopOnlyHeader = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

export const MobileEarlylandHeader = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--color-white);
    border-radius: 12px;
    box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
    padding: 10px;
    width: 100%;
    margin-top: 20px;
  }
`;

export const MobileTopRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
`;

export const MobileSearchArea = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  height: 38px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 0 8px;
  border: none;
  cursor: pointer;
  text-align: left;

  span {
    font-family: "Gilroy", sans-serif;
    font-size: 16px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-soft);
  }
`;

export const MobileAdBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 8px;
  background: linear-gradient(90deg, #0fa4e9, #6266f1);
  border: none;
  cursor: pointer;

  .ad-badge {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 3px 7px;
    font-family: "Gilroy", sans-serif;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-white);
    white-space: nowrap;
  }
`;

export const MobileCrownBtn = styled.button`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MobileSegmentedControl = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 8px;
  height: 38px;
  width: 100%;
`;

export const MobileSegmentedTab = styled.button<{ active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: ${({ active }) => (active ? "var(--color-white)" : "transparent")};
  box-shadow: ${({ active }) =>
    active ? "2px 2px 8px 0px rgba(0, 5, 48, 0.08)" : "none"};
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: ${({ active }) => (active ? "var(--color-primary)" : "#728094")};
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
`;
