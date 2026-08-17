import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  &.card {
    flex-direction: unset;
  }
  max-height: 650px;
  overflow-y: auto;
  gap: 20px;
  padding-bottom: 5px;
`;

export const CardWrapper = styled(BaseCard)`
  position: relative;
  width: 100%;
  cursor: pointer;

  &.card {
    min-width: 250px;
  }

  & .arrow {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  & .twitter-photo {
    margin-top: 10px;
    max-width: 100%;
    object-fit: cover;
  }
`;

export const DateWrapper = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: #0d0f2b;
  margin-bottom: 6px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -moz-box;
  -moz-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
`;

export const NewsText = styled(Typography)`
  margin-top: 12px !important;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 19px;
  white-space: normal !important;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -moz-box;
  -moz-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3;
`;

export const NewsHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px !important;
`;

export const AccInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  & .name {
    display: flex;
    gap: 12px;

    div {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      line-height: 17.15px;
    }

    span {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }

  & .followers {
    font-size: 14px;
    color: var(--color-text-muted);
  }
`;
