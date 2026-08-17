import styled from "styled-components";
import BaseCard from "../../../global/common/BaseCard";

export const TabTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
  margin-top: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const FeedItemWrapper = styled(BaseCard)`
  margin-top: 10px;
  padding: 16px !important;
  width: 623px;

  @media (max-width: 767px) {
    width: 100%;
  }

  h6 {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  h5 {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
    margin-bottom: 6px;
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
  }

  &:first-child {
    margin-top: 12px;
  }
`;

export const OverviewTabWrapper = styled.div`
  display: flex;
  gap: 16px;

  & > div {
    width: calc(50% - 8px);
  }

  @media (max-width: 767px) {
    flex-direction: column-reverse;
    width: 100%;
  }
`;

export const OverviewLeftWrapper = styled.div`
  p {
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
  }
`;

export const OverviewRatingWrapper = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-white);
  background: var(--color-warning);
  border-radius: 99px;
  width: 67px;
  height: 67px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const TasksWrapper = styled.div`
  display: flex;
  position: relative;
  flex-wrap: wrap;
`;

export const TasksColumnWrapper = styled.div`
  padding: 0 15px;
  width: 25%;
  width: 325px;

  &:not(:last-child) {
    border-right: 2px solid #f8f8f9;
  }
  &:first-child {
    padding-right: 16px;
    padding-left: 0;
  }
  &:last-child {
    padding-left: 16px;
    padding-right: 0;
  }
`;

export const Circle = styled.div<{ bg: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background: ${({ bg }) => bg};
`;

export const TasksColumn = styled.div`
  max-height: 452px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
`;

export const AddTaskButton = styled.button`
  border: none;
  padding: 0;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
`;

export const BoardRow = styled.div<{
  isSelected: boolean;
  isUsersIncludes: boolean;
}>`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px;
  border-radius: 6px;
  background: ${({ isSelected }) => (isSelected ? "#f4f4f4" : "")};

  cursor: pointer;
  box-shadow: 2px 2px 8px 0px #00053026;

  & > div:first-child {
    display: flex;
    gap: 10px;
    align-items: center;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }

  button {
    background: none;
    border: none;
    padding: 0;
  }
`;

export const DropdownButtonWrapper = styled.div`
  position: relative;

  & > button {
    width: 20px;
  }

  div {
    position: absolute;
    background: var(--color-white);
    border: 1px solid rgba(83, 98, 124, 0.07);
    box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    width: max-content;
    display: flex;
    flex-direction: column;
    z-index: 10;
    padding: 16px;
    top: 0;
    right: 100%;

    button {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19px;
      color: var(--color-text-primary);
      text-align: left;

      &:not(:last-child) {
        margin-bottom: 10px;
      }
    }
  }
`;

export const FeedTabWrapper = styled.div`
  max-height: 700px;
  overflow-y: auto;
`;

export const AddBoardButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  border: none;
  background: none;
  position: absolute;
  right: 0;
  top: -25px;
  z-index: 10;

  @media (max-width: 880px) {
    position: relative;
    margin-top: 20px;
  }
`;

export const BoardLine = styled.div`
  display: block;
  width: 2px;
  height: 26px;
  background: gray;
  opacity: 0.5;
`;

export const BoardInfoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ProjectInfoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  & img {
    width: 32px;
    height: 32px;
  }
`;

export const ProjectInfo = styled.div`
  & span {
    font-weight: var(--font-weight-regular);
  }
`;

export const BoardRowUsers = styled.div<{ isOpen: boolean }>`
  margin-top: 6px;
  border: ${({ isOpen }) => (isOpen ? "1px solid var(--input-active)" : "0px")};
  padding-bottom: ${({ isOpen }) => (isOpen ? "4px" : "0px")};
  border-top: 0px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  box-shadow: ${({ isOpen }) =>
    isOpen ? "0px 3px 8px 1px #00053026" : "0px 0px 0px 0px #00053026"};
`;

export const BoardRowUsersBtn = styled.button<{ isUsersList: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  border-radius: 6px;
  border-top-right-radius: 0px;
  border-top-left-radius: 0px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 19px;
  color: var(--color-primary);
  &:hover {
    background: var(--input-active);
  }

  &:active {
    opacity: 0.8;
  }

  svg {
    transform: ${({ isUsersList }) =>
      isUsersList ? "rotate(180deg)" : "rotate(0deg)"};
  }
`;

export const BoardRowUsersList = styled.div<{ isVisible: boolean }>`
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  transition: opacity 0.2s ease;
  max-height: ${({ isVisible }) => (isVisible ? "500px" : "0px")};
  overflow: ${({ isVisible }) => (isVisible ? "auto" : "hidden")};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`;

export const BoardRowUserWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px 4px 8px;
`;

export const BoardRowUserAction = styled.div`
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 3px;

    &:hover {
      background: var(--input-active);
    }

    &:active {
      opacity: 0.8;
    }
  }
`;

export const BoardTypesWrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 5px 0;
`;

export const EmptyListWrapper = styled.div`
  max-width: fit-content;
  margin: 40px auto;
`;

export const BoardRowSearch = styled.div`
  padding: 4px 6px;
`;
