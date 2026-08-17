import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const Wrapper = styled(BaseCard)`
  padding: 20px !important;
  width: calc(25% - 20px);
  cursor: pointer;
  position: relative;
  height: auto;

  @media (max-width: 1204px) {
    width: calc(33.33% - 20px);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 16px !important;
    height: max-content;
  }
`;

export const NewsImage = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 6px;
  overflow: hidden;
  height: 160px;
`;

export const Date = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: rgba(7, 11, 53, 0.5);
  margin-bottom: 8px !important;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 29px;
  color: var(--color-text-primary);
  white-space: normal !important;
  margin-top: 20px !important;

  display: -webkit-box;
  -webkit-line-clamp: 2; /* максимум 2 строки */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Description = styled(Typography)``;

export const DescriptionNews = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  white-space: normal !important;
  max-height: 48px;
  overflow: hidden;

  h1,
  h2 {
    margin-bottom: 12px;
  }
`;

export const Category = styled.div`
  position: absolute;
  top: 40px;
  right: 40px;
  max-width: fit-content;
  border-radius: 6px;
  font-weight: var(--font-weight-semibold);
  color: var(--main-green);
  padding: 4px 10px;
  background: #e9f8f8;
  font-size: 14px;
`;

export const NewsInfoCategory = styled.div`
  max-width: fit-content;
  border-radius: 6px;
  font-weight: var(--font-weight-semibold);
  color: var(--main-green);
  padding: 4px 10px;
  background: #e9f8f8;
  font-size: 14px;
`;

export const UserData = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const UserInfoWrapper = styled.div`
  margin-top: 20px;
  div {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
  span {
    color: var(--color-text-muted);
  }
`;

export const NewsInfoWrapper = styled.div`
  & .news-item-text {
    margin-top: 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
  }
`;

export const NewsInfoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  & .user-info {
    div {
      margin-bottom: 2px;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }
    span {
      color: var(--color-text-muted);
      font-size: 14px;
    }
  }

  & .category {
    margin: 0px;
    margin-top: 5px;
    font-size: 12px;
    color: var(--main-green);
    padding: 5px;
    border-radius: 6px;
    font-weight: var(--font-weight-regular);
    background: #e9f8f8;
  }
`;
