import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

const transactionsTableColumns = "1.8fr 1.5fr 1.5fr 1.5fr 1.5fr";
const transactionsTableMinWidth = "720px";

export const Wrapper = styled.div<{ $core?: boolean }>`
  margin-top: ${({ $core }) => ($core ? "0" : "40px")};
`;

export const Header = styled.div<{ $core?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ $core }) => ($core ? "15px" : "20px")};

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: ${({ $core }) => ($core ? "22px" : "24px")};
    line-height: ${({ $core }) => ($core ? "27px" : "100%")};
    letter-spacing: ${({ $core }) => ($core ? "-0.02em" : "0")};
    ${({ $core }) => ($core ? "margin: 0;" : "")}
  }

  & .tab {
    width: 102px !important;
  }
`;

export const Body = styled(BaseCard)<{ $core?: boolean }>`
  width: 100%;
  border: ${({ $core }) => ($core ? "1px solid #f0f2f5" : "none")};
  ${({ $core }) =>
    $core
      ? `
    border-radius: 14px;
    box-shadow: rgba(0, 5, 48, 0.06) 2px 2px 8px;
  `
      : ""}
  overflow-x: auto;
  @media (max-width: 640px) {
    padding: 16px;
  }
`;

export const TableHeader = styled.div<{ $core?: boolean }>`
  display: grid;
  align-items: center;
  grid-template-columns: ${transactionsTableColumns};
  width: 100%;
  min-width: ${transactionsTableMinWidth};

  & > div:first-child {
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    background: ${({ $core }) => ($core ? "#f7f9fb" : "#f5fbfd")};
  }

  @media (max-width: 640px) {
    div {
      font-size: 12px;
    }
  }

  div {
    font-weight: var(--font-weight-semibold);
    font-size: ${({ $core }) => ($core ? "12px" : "14px")};
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-gray);
    text-align: left;
    padding: ${({ $core }) => ($core ? "11px 10px" : "6.5px 10px")};
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background: ${({ $core }) => ($core ? "#f7f9fb" : "transparent")};
    text-transform: ${({ $core }) => ($core ? "uppercase" : "none")};
    letter-spacing: ${({ $core }) => ($core ? "0.04em" : "0")};
  }

  ${({ $core }) =>
    $core
      ? `
    & > div:not(:first-child) {
      justify-content: flex-end;
      text-align: right;
    }
  `
      : ""}
`;

export const TableList = styled.div<{ $core?: boolean }>`
  margin-top: ${({ $core }) => ($core ? "0" : "10px")};
  width: 100%;
  min-width: ${transactionsTableMinWidth};
`;

export const TableRow = styled.div<{ $core?: boolean }>`
  display: grid;
  align-items: center;
  grid-template-columns: ${transactionsTableColumns};
  width: 100%;
  min-width: ${transactionsTableMinWidth};
  border-top: 1px solid #f0f2f5;

  & > div:first-child {
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    background: ${({ $core }) => ($core ? "#fff" : "#f5fbfd")};
  }

  .item {
    padding: ${({ $core }) => ($core ? "12px 10px" : "6.5px 10px")};

    & .value {
      font-size: ${({ $core }) => ($core ? "13px" : "14px")};

      &.bold {
        font-weight: var(--font-weight-semibold);
      }
    }
    span {
      font-size: 10px;
      color: var(--main-gray);
    }

    & .small-value {
      margin-top: 4px;
      font-size: 10px;
    }

    @media (max-width: 640px) {
      .value {
        font-size: 12px;
      }
      span,
      .small-value {
        font-size: 9px;
      }
    }
  }

  ${({ $core }) =>
    $core
      ? `
    & > .item:not(:first-child),
    & > .table-column:not(:first-child) {
      text-align: right;
    }
  `
      : ""}
`;

export const Section = styled.div<{ $core?: boolean }>`
  width: 100%;
  min-width: ${transactionsTableMinWidth};

  .section-title {
    margin-top: 10px;
    border-top: 1px solid #f0f2f5;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
    padding: 20px 10px 8px;
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    width: 100%;
    box-sizing: border-box;
    background: ${({ $core }) => ($core ? "#f7f9fb" : "#f5fbfd")};
  }
`;
