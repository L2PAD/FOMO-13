import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 40px;
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    letter-spacing: 0%;
    margin: 0px;

    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
`;

export const DescriptionWrapper = styled.div`
  & .description-component {
    width: 300px;
    padding: 10px;
    z-index: 1;
    background: white;
    position: absolute;
    top: 30px;
    left: -10px;

    @media (max-width: 480px) {
      width: 250px;
      left: 0;
    }

    div {
      font-size: 14px;
      color: var(--main-gray);

      p {
        margin: 8px 0;
      }
    }
  }
`;

export const TitleWrapper = styled.div`
  position: relative;

  display: flex;
  align-items: center;
  gap: 6px;

  button {
    height: 14px;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;

  @media (max-width: 480px) {
    width: 100%;
  }

  button {
    padding: 8px 16px;
    font-size: 14px;

    @media (max-width: 480px) {
      flex: 1;
    }
  }

  .photo-btn {
    @media (max-width: 480px) {
      flex: 0;
    }
  }
`;

export const SearchResults = styled(BaseCard)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 20;
  padding: 8px;
  max-width: 560px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);

  &.empty {
    padding: 18px 16px;
    text-align: center;
    color: var(--main-gray);
  }
`;

export const SearchResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  border: none;
  background: transparent;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    background: #f7f8fa;
  }

  & > div:first-child {
    width: auto;
    min-width: 0;
    flex: 0 1 auto;
  }

  & > div:first-child .info {
    width: auto;
    flex-grow: 0;
    align-items: flex-start;
    text-align: left;
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: auto;
    text-align: right;
    gap: 4px;
    color: var(--main-gray);
    font-size: 13px;
  }
`;

export const CompareWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 15px;

  @media (max-width: 1024px) {
    -webkit-overflow-scrolling: touch;
  }
`;

export const CompareHeader = styled.div`
  display: flex;
  gap: 20px;
  min-width: max-content;
  margin-top:10px;

  & .header-item {
    width: 295px;
    position: relative;

    @media (max-width: 1024px) {
      width: 240px;
    }

    @media (max-width: 768px) {
      width: 220px;
    }

    .remove-user-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      border: none;
      background: #f0f2f5;
      color: var(--main-gray);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      z-index: 2;
    }
  }
  margin-bottom: 20px;
`;

export const CompareRow = styled.div`
  display: flex;
  gap: 20px;
  min-width: max-content;
`;

export const CompareCardWrapper = styled.div`
  min-width: max-content;
`;

export const CompareSectionToggleBtn = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px;

  @media (max-width: 768px) {
    padding: 10px 0;
  }
`;

export const CompareCard = styled(BaseCard)`
  width: 295px;

  @media (max-width: 1024px) {
    width: 240px;
  }

  @media (max-width: 768px) {
    width: 220px;
  }

  & .row-item {
    padding: 18px 10px;
    font-size: 14px;
    border-bottom: 1px solid #f0f2f5;

    @media (max-width: 768px) {
      padding: 15px 8px;
      font-size: 13px;
    }

    &:last-child {
      border: none;
    }
  }

  & .key {
    font-weight: var(--font-weight-semibold);
    color: var(--main-gray);
  }

  & .green {
    color: var(--color-primary);
  }

  & .red {
    color: #ef4444;
  }
`;

export const AnimatedSection = styled.div<{ isOpen: boolean }>`
  display: flex;
  gap: 20px;
  max-height: ${({ isOpen }) => (isOpen ? "1000px" : "0")};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  overflow: hidden;
  transition:
    max-height 0.4s ease,
    opacity 0.4s ease;
  min-width: max-content;
`;

export const UserSearchWrapper = styled.div`
  margin-bottom: 20px;
  max-width: 400px;
  position: relative;

  @media (max-width: 768px) {
    max-width: 100%;
  }

  .small-input {
    width: 100%;
  }
`;

export const StateCard = styled(BaseCard)`
  margin-top: 20px;
  padding: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: var(--main-gray);
  }

  button {
    margin-top: 14px;
  }
`;
