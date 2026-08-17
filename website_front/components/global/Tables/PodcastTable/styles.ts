import styled from "styled-components";
import AudioPlayer from "react-h5-audio-player";
import BaseCard from "../../common/BaseCard";

export const TableWrapper = styled.div`
  overflow-x: auto;
  padding-right: 10px;
`;
export const CardsWrapper = styled.div`
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ContentWrapper = styled.div<{ isOpen: boolean }>`
  align-items: center;
  display: flex;
  border-bottom: ${({ isOpen }) => (isOpen ? "2px solid #F8F8F9" : "none")};
  padding-bottom: ${({ isOpen }) => (isOpen ? "13px" : "0")};
`;

export const CardWrapper = styled(BaseCard)`
  width: 1190px;
  padding: 16px;
`;

export const AudionWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  width: 631px;
  button {
    border: none;
    background: none;
    position: relative;
    border-radius: 100px;

    svg {
      position: absolute;
      z-index: 4;
      top: 8px;
      left: 8px;
      width: 16px;
      height: 16px;
    }
  }
  div {
    p {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
    }
    span {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
    }
  }
`;

export const RatingWrapper = styled.div`
  width: 130px;

  & > p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 1px;
  }

  & > div {
    display: flex;
    gap: 10px;

    div:last-child {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
    }
  }
`;

export const ThemeWrapper = styled.div`
  width: 210px;
  margin-right: 20px;

  & > p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 1px;
  }

  div {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ReactionButton = styled.button<{ active: boolean }>`
  background: ${({ active }) => (active ? "var(--color-primary)" : "#F8F8F9")};
  border-radius: 99px;
  padding: 4px 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ active }) => (active ? "var(--color-white)" : "var(--color-text-primary)")};
  display: flex;
  gap: 6px;
  align-items: center;
  border: none;
`;

export const PinButton = styled.button`
  background: none;
  padding: 0;
  border: none;
`;

export const PlayerAudio = styled(AudioPlayer)`
  padding: 0 !important;
  background: none;
  box-shadow: none;

  .rhap_controls-section {
    display: none;
  }

  .rhap_progress-bar-show-download {
    background-color: rgba(4, 165, 132, 0.25);
    height: 4px;
  }

  .rhap_progress-filled {
    background-color: var(--color-primary);
    height: 4px;
  }

  .rhap_progress-indicator {
    background: var(--color-primary);
    border: 3px solid var(--color-white);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    border-radius: 99px;
    width: 20px;
    height: 20px;
  }

  .rhap_time {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
  }
`;

export const DropdownWrapper = styled.div`
  margin-top: 14px;

  & > p {
    margin-top: 14px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }
`;
