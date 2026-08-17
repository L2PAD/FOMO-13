import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  max-height: 300px;
  overflow: hidden;

  @media (max-width: 768px) {
    max-height: fit-content;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    color: #1e1e1e;
  }
`;

export const Body = styled.div`
  margin-top: 0px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  gap: 16px;

  .news-item-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }

  .user-info div,
  .user-info span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    max-height: fit-content;
  }
`;

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0px 15px;

  & .info {
    & .info-item {
      max-width: fit-content;
      margin-left: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      span {
        font-size: 14px;
        font-weight: var(--font-weight-semibold);
        color: var(--main-black);
      }
      div {
        font-size: 14px;
        color: var(--color-text-muted);
      }
    }
  }
`;
