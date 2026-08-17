import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 60px;
  margin-bottom: 60px;
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

  & .actions{
    display: flex;
    align-items: center;
    gap: 20px;
    width: 50%;

    & .bg-switch{
      width:250px;
    }
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

export const LeftColumn = styled.div`
  width: 50%;
`

export const ListItem = styled(BaseCard)`
  width: 100%;
  padding: 30px;

  & .chart-wrapper{
    margin-top: 24px;

    & .recharts-surface{
      font-size: 16px !important;
    }

    & .recharts-cartesian-axis-line{
      display: none;
    }

    & .recharts-cartesian-axis{
      transform: translateY(13px);
    }

    & .recharts-cartesian-axis-tick-line{
      display: none;
    }
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

  & .info .name{
    font-size: 22px;
  } 

  & .info .description{
    font-size: 18px;
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
  button {
    width: 50%;
    border-radius: 6px !important;
  }

  & .actions {
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


export const ListItemStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
    margin: 18px 0;

  & .stats-item{
    padding: 12px;
    margin-top: 3px;
    display: flex;
    align-items:center;
    flex-wrap: wrap;
    justify-content: center;
    background: white;
    border-radius: 6px;
    box-shadow: 2px 2px 1px 1px #e9e9e9c4;
    gap: 6px;

    & .prediction{
      font-size: 16px;
        font-weight: var(--font-weight-semibold);
    }
  }
    & .prediction-stats{
  }

`

export const RightColumn = styled.div`
margin-top: 40px;
  width: 50%;
`

export const MainInfoWrapper = styled.div`
  display:flex;
  align-items: flex-end;
  align-items: center;
  justify-content: space-between;
  gap: 60px;


  & .mood-bar-wrapper {
    width: 100%;
  }

  
  & .keywords {
    font-size: 16px;
  }

  & .stats-value{
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
`

export const ParsingDetails = styled.div`
  display: flex;
  flex-direction: column;
  width: 50%;
  margin-left: auto;

  & .d-item{
    max-width: fit-content;
    margin-left: auto;
    display: flex;
    gap: 4px;
    flex-direction: column;
    text-align: right;

    & .d-key{
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
    }
    & .d-value{
      font-weight: var(--font-weight-regular);
      font-size: 16px;
    }
  }
`