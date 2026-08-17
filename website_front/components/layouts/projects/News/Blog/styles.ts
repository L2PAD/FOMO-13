import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import BaseCard from "../../../../global/common/BaseCard";
import { Button } from "../../../../global/common/Button";

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 26px;
  margin-top: 16px;
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const PageDate = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  color: var(--color-text-muted);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
`;

export const NewsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;

  .main-news {
    width: 100%;
  }
  a {
    transition: all 0.3s ease;
  }
  a:hover {
    opacity: 0.8;
  }
  a:active {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

export const CommentsWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CommentsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
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

export const SearchContainer = styled.div`
  position: relative;
  margin-top: auto;
  max-width: 50%;

  & .search-wrapper {
    top: 64px;
  }
`;

export const MainNewsWrapper = styled.div`
  position: relative;
  width: 100%;

  img {
    object-fit: cover;
    width: 100%;
    max-height: 400px;
    border-radius: 12px;
  }
`;

export const MainNewsCategory = styled.div`
  padding: 4px 10px;
  background: #4b6bfb;
  border-radius: 6px;
  font-size: 14px;
  max-width: fit-content;
  color: white;
  line-height: 20px;
`;

export const MainNewsTitle = styled.div`
  max-width: 70%;
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  margin-top: 16px;
  margin-bottom: 24px;
  color: white;
`;

export const MainNewsInfo = styled.div`
  position: absolute;
  bottom: 38px;
  left: 40px;
`;

export const UserData = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    width: 38px;
    height: 38px;
    object-fit: cover;
    border-radius: 50%;
  }
`;

export const UserInfoWrapper = styled.div`
  div {
    margin-bottom: 2px;
    color: white;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
  }
  span {
    color: white;
  }
`;

export const PlaceholderWrapper = styled.div`
  margin-top: 40px;
`;

export const ShowMoreButton = styled.div`
  max-width: fit-content;
  margin: 30px auto 0px;

  button {
    text-align: center;
    font-size: 14px;
    color: var(--color-text-muted);
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      opacity: 0.6;
    }
  }
`;

export const OldNewsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
