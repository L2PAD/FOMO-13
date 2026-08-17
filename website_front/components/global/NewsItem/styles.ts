import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const Wrapper = styled(BaseCard)`
  padding: 20px !important;
  width: 100%;
  cursor: pointer;
  position: relative;
  height: 100%;
`;

export const NewsImage = styled.div`
  position: relative;
  width: 100%;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
`;

export const NewsPreviewImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  margin-bottom: 20px !important;
  margin-top: 20px !important;
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
  top: 30px;
  right: 30px;
  max-width: fit-content;
  border-radius: 6px;
  font-weight: var(--font-weight-semibold);
  color: var(--main-green);
  padding: 4px 10px;
  background: #e9f8f8;
  font-size: 14px;

  @media (max-width: 768px) {
    top: 72px;
    right: 16px;
  }
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

  img {
    width: 38px;
    height: 38px;
    object-fit: cover;
    border-radius: 50%;
  }
`;

export const UserInfoWrapper = styled.div`
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
