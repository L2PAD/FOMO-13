import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 40px;
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .photo-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid #f0f2f5;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--main-gray);
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
  }

`;

export const DescriptionWrapper = styled.div`
  & .description-component {
    width: 300px;
    padding: 10px;
    z-index: 2;
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

export const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchWrapper = styled.div`
  width: 100%;
  max-width: 360px;
`;

export const TableWrapper = styled(BaseCard)`
  width: 100%;
  min-width: 860px;
`;

export const TableHeader = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 2.5fr 1.8fr 1.2fr 1.4fr 1.2fr 1fr 1fr;
  border-bottom: 1px solid #f0f2f5;
  padding: 10px 0;
  gap: 12px;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--main-gray);
  }
`;

export const TableList = styled.div`
`;

export const TableRow = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 2.5fr 1.8fr 1.2fr 1.4fr 1.2fr 1fr 1fr;
  border-bottom: 1px solid #f0f2f5;
  padding: 12px 0;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }

  .rating-wrapper {
    display: none !important;
  }

  div {
    font-size: 14px;
    word-break: break-word;
  }

  .green {
    color: var(--green);
    font-weight: var(--font-weight-semibold);
  }

  .red {
    color: #f04438;
    font-weight: var(--font-weight-semibold);
  }
`;

export const StateCard = styled(BaseCard)`
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
  }

  p {
    margin: 0;
    color: var(--main-gray);
  }
`;

export const Pagination = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

export const EmptyText = styled.div`
  color: var(--main-gray);
  font-size: 14px;
`;
