import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 40px;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;

  & .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    position: relative;
  }

  & .description {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }
`;

export const ListWrapper = styled.div``;

export const SelectedItems = styled.div`
  max-width: 50%;

  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;

  div {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f5fbfd;
    padding: 4px 8px;
    font-size: 14px;

    img {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    button {
      height: 12px;
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

export const List = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 64px;
  }
`;

export const ListItem = styled(BaseCard)`
  width: 100%;

  & .mood-bar-wrapper {
    width: 100%;
  }
`;

export const ListItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .acc-item-left-wrapper {
    display: flex;
    gap: 20px;
    width: 35%;
  }

  & .keywords {
    font-size: 14px;
    color: var(--main-gray);
    margin-left: 30px;
    margin-right: 10px;
  }

  & .actions {
    position: relative;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  & .actions-wrapper .actions-modal {
    position: absolute;
    width: 170px;
    z-index: 10;
    top: 30px;
    left: -50px;
  }
`;

export const ListItemTweets = styled.div<{ isOpen?: boolean }>`
  margin-top: 20px;
  max-height: ${({ isOpen }) => (isOpen ? "500px" : "0")};
  overflow: hidden;
  overflow-y: ${({ isOpen }) => (isOpen ? "auto" : "hidden")};
  transition: max-height 0.3s ease;
  padding-top: ${({ isOpen }) => (isOpen ? "12px" : "0")};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: all 0.3s ease;

  /* Custom Scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #c0c0c0 transparent; /* Firefox */

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #c0c0c0;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #a0a0a0;
  }
`;

export const TweetItem = styled.div`
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
  padding: 20px 0;
  margin-right: 5px;

  & .tweet-body {
    display: flex;
    align-items: flex-start;
  }
  & .tweet-text {
    max-width: 60%;
    font-size: 14px;
    color: var(--main-black);
  }

  & .tweet-right {
    display: grid;
    grid-template-columns: 0.8fr 0.4fr 0.2fr;
    align-items: center;
    width: 40%;
    padding-left: 50px;
    margin-left: auto;
  }

  & .tweet-date {
    max-width: fit-content;
    margin-left: auto;
    margin-right: 20px;
    font-size: 14px;
    color: var(--main-gray);
  }

  & .tweet-btn {
  }
`;

export const AddBtnWrapper = styled.div`
  max-width: 200px;
  margin-left: auto;
  width: 100%;
  button {
    width: 100%;
    border-radius: 6px !important;
  }
`;
export const ItemImagesWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 20px;

  img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
  }
`;

export const AccountInfoWrapper = styled.div`
  & .followers-info-item {
    width: 100%;
    display: flex;
    align-items: center;
  }
`;
