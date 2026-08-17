import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    letter-spacing: 0%;
    margin: 0px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const DescriptionWrapper = styled.div`
  & .description-component {
    width: 300px;
    padding: 10px;
    z-index: 1;
    background: white;
    position: absolute;
    top: 30px;
    left: -10px;
    div {
      font-size: 14px;
      color: var(--main-gray);

      p {
        margin: 8px 0;
      }
    }
  }
`;

export const TitleWrapper = styled.div`
  position: relative;

  display: flex;
  align-items: center;
  gap: 6px;

  button {
    height: 14px;
  }
`;

export const UserSearchWrapper = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SwitchWrapper = styled.div`
  margin-left: auto;
`;

export const TableWrapper = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
  min-width: 500px;
`;

export const TableHeader = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 0.7fr 3.2fr 2.6fr 2.6fr 2.6fr;
  border-bottom: 1px solid #f0f2f5;
  padding: 10px 0;
  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--main-gray);
  }
`;

export const TableList = styled.div``;

export const TableRow = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 0.7fr 3.2fr 2.6fr 2.6fr 2.6fr;
  border-bottom: 1px solid #f0f2f5;
  padding: 10px 0;
  & .rating-wrapper {
    display: none !important;
  }

  div {
    font-size: 14px;
  }

  .roi {
    font-weight: var(--font-weight-semibold);
  }

  .roi.muted {
    color: var(--main-gray);
  }
`;

export const EmptyState = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
  }

  p {
    margin: 0;
    color: var(--main-gray);
    font-size: 14px;
  }

  button {
    width: fit-content;
    margin-top: 4px;
  }
`;

export const PaginationWrapper = styled.div`
  margin-top: 20px;
`;
