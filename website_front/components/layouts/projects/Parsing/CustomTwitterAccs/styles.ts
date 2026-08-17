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

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const ListWrapper = styled.div``;

export const SelectedItems = styled.div`
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
`;

export const ListItem = styled(BaseCard)`
  width: 100%;
  /* do not hide overflow to keep actions modal visible */
`;

export const AccountInfoWrapper = styled.div`
  & .followers-info-item {
    display: flex;
    align-items: center;
  }
  /* allow EntityInfo to shrink inside grid */
  min-width: 0;
`;

export const ListItemHeader = styled.div`
  display: grid;
  align-items: center;
  /* prevent content-based overflow with minmax(0, …) */
  grid-template-columns: minmax(0, 8fr) minmax(0, 2fr) auto;
  column-gap: 16px;

  /* make grid items shrinkable */
  & > div:first-child,
  & ${AccountInfoWrapper} {
    min-width: 0;
  }

  & .keywords {
    font-size: 14px;
    color: var(--main-gray);
    margin-left: 30px;
    margin-right: 10px;
    /* critical to avoid overflow */
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .actions {
    position: relative;
    display: flex;
    align-items: center;
    gap: 15px;
    justify-self: end;
    flex-shrink: 0;
  }

  & .actions-wrapper .actions-modal {
    position: absolute;
    width: 170px;
    z-index: 10;
    top: 30px;
    left: -50px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    row-gap: 8px;

    .keywords {
      margin: 0;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      overflow-wrap: anywhere;
    }

    .actions {
      justify-self: start;
    }
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
    gap: 12px;
    /* allow wrap when needed to avoid overflow */
    flex-wrap: wrap;
  }

  & .tweet-text {
    /* let text shrink and wrap safely */
    flex: 1 1 auto;
    min-width: 0;
    max-width: 75%;
    font-size: 14px;
    color: var(--main-black);
    overflow-wrap: anywhere;
    word-break: break-word;
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

  @media (max-width: 767px) {
    .tweet-text {
      max-width: 100%;
    }
    .tweet-date {
      margin-left: 0;
      margin-right: 0;
    }
  }
`;

export const AddBtnWrapper = styled.div`
  max-width: fit-content;
  margin: 20px auto 0;
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

export const MobileAccountsSlider = styled.div`
  width: 100%;

  .accounts-swiper {
    padding: 5px 0;
    margin: 0 -10px;
    padding: 0 10px;
  }

  .swiper-slide {
    width: 300px;
    height: auto;
  }
`;
