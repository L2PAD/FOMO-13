import styled from "styled-components";
import BaseCard from "../../../global/common/BaseCard";

export const ContentWrapper = styled.div`
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: 1fr 300px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const LeftContentWrapper = styled.div`
  padding-right: 16px;
  border-right: 2px solid #f8f8f9;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    color: #738094;
    margin-bottom: 9px;
  }
`;

export const LeftContentCommentsWrapper = styled.div`
  margin-top: 16px;
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 767px) {
    .comment-text {
      margin-top: 110px !important;
    }
  }
`;

export const RightContentWrapper = styled.div`
  padding-left: 16px;
`;

export const RightContentCommentsWrapper = styled.div`
  gap: 16px;

  @media (max-width: 1200px) and (min-width: 600px) {
    display: flex;
  }

  & > div {
    margin-top: 16px;

    @media (max-width: 1200px) and (min-width: 600px) {
      width: 50%;
    }

    & > p {
      font-weight: var(--font-weight-semibold);
      font-size: 20px;
      line-height: 24px;
      color: #738094;
      margin-bottom: 9px;

      &:not(:first-child) {
        margin-top: 16px;
      }
    }

    & > div {
      overflow-y: auto;
      max-height: 300px;
      padding-right: 5px;
    }
  }
`;

export const HotCommentWrapper = styled(BaseCard)`
  padding: 16px !important;
  margin-bottom: 8px;
  position: relative;
  width: 100%;
  margin-right: 5px;
`;

export const HotCommentHeaderWrapper = styled.div`
  display: flex;
  gap: 44px;
  margin-bottom: 16px;

  div {
    p {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: #738094;
    }
    span {
      font-weight: 460;
      font-size: 14px;
      line-height: 16px;
    }
  }
`;

export const HotCommentContentWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  & > div {
    img {
      width: 40px;
      height: 40px;
    }
    &:first-child span {
      top: -16px;
    }
    &:last-child {
      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16px;
        color: #738094;
      }
      p {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
      }
    }
  }
`;

export const HiddenContent = styled.div`
  position: absolute;
  width: calc(100% + 4px);
  left: -4px;
  top: -4px;
  height: calc(100% + 4px);
  background: rgba(224, 224, 224, 0.12);
  backdrop-filter: blur(7.5px);
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 64px;
  line-height: 77px;
  color: rgba(115, 128, 148, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;
