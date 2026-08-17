import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div<{ $core?: boolean }>`
  margin-top: ${({ $core }) => ($core ? "0" : "40px")};
  width: 100%;
`;

export const Header = styled.div<{ $core?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ $core }) => ($core ? "14px" : "0")};
  margin-bottom: ${({ $core }) => ($core ? "15px" : "20px")};
  flex-wrap: ${({ $core }) => ($core ? "wrap" : "nowrap")};

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
    overflow: hidden;
  `
      : ""}
`;

export const TableHeader = styled.div<{ $core?: boolean }>`
  display: grid;
  align-items: center;
  grid-template-columns: 2.4fr 2.4fr 2.4fr 2.4fr 2.4fr;
  min-width: 800px;

  &.ico {
    grid-template-columns: 1.2fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 1.4fr;
  }

  &.category {
    grid-template-columns: 1.6fr 1.6fr 1.6fr 1.6fr 1.6fr;
  }

  div:first-child {
    position: sticky;
    left: 0;
    background: white;
    z-index: 10;
    background: ${({ $core }) => ($core ? "#f7f9fb" : "#f5fbfd")};
  }

  div {
    font-weight: var(--font-weight-semibold);
    font-size: ${({ $core }) => ($core ? "12px" : "14px")};
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-gray);
    text-align: left;
    padding: ${({ $core }) => ($core ? "11px 12px" : "6.5px 10px")};
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
    div:not(:first-child) {
      justify-content: flex-end;
      text-align: right;
    }
  `
      : ""}
`;

export const TableList = styled.div<{ $core?: boolean }>`
  margin-top: ${({ $core }) => ($core ? "0" : "10px")};
  min-width: 800px;
`;

export const TableRow = styled.div<{ isDeleted?: boolean; $core?: boolean }>`
  position: relative;
  display: grid;
  align-items: center;
  grid-template-columns: 2.4fr 2.4fr 2.4fr 2.4fr 2.4fr;
  min-height: ${({ $core }) => ($core ? "58px" : "auto")};
  border-top: 1px solid #f0f2f5;
  opacity: ${props => props.isDeleted ? 0.5 : 1};
  cursor: ${props => props.isDeleted ? 'not-allowed' : ''};

  & .remove-item{
    position: absolute;
    top: 14px;
    right: 10px;
  }

  & .edit-item{
    display: flex;
    align-items: center;
    padding-left: 10px;

    & .item{
      padding-left: 0px;
    }
  }

  &.ico {
    grid-template-columns: 1.2fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 1.4fr;
    & .item {
      padding: 18px 10px;
    }
  }

  &.category {
    grid-template-columns: 1.6fr 1.6fr 1.6fr 1.6fr 1.6fr;
    & .item {
      padding: 18px 10px;
    }
  }

  & > div:first-child {
    position: sticky;
    left: 0;
    background: white;
    z-index: 10;
    background: ${({ $core }) => ($core ? "#fff" : "#f5fbfd")};
  }

  & .item {
    padding: ${({ $core }) => ($core ? "12px" : "6.5px 10px")};

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

    &.Vesting {
      color: #860d73;
    }

    & .Partially Claimed {
      color: #860d73;
    }

    & .Vesting {
      color: #860d73;
    }

    & .status {
      display: flex;
      align-items: center;
      gap: 8px;

      button {
        line-height: 0px;
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

    & > .item:not(:first-child) .value,
    & > .table-column:not(:first-child) .value {
      text-align: right;
    }
  `
      : ""}
`;
export const ActionsWrapper = styled.div<{
  $core?: boolean;
  $isEditing?: boolean;
}>`
  max-width: 100%;
  display: flex;
  gap: ${({ $core }) => ($core ? "8px" : "20px")};

  button {
    padding: 12px 14px !important;
    height: 34px;
    font-size: 12px;
    font-weight: 600 !important;
    width: auto;
    span {
      font-size: 12px !important;
    }
  }

  @media (max-width: 767px) {
    width: 100%;
    flex: 1 0 100%;
    flex-wrap: ${({ $isEditing }) => ($isEditing ? "wrap" : "nowrap")};

    ${({ $isEditing }) =>
      $isEditing
        ? `
          & > button,
          & > div {
            width: 100%;
            min-width: 0;
            flex: 1 0 100%;
          }

          & > div > button {
            width: 50% !important;
            min-width: 0;
            flex: 1 1 0;
          }
        `
        : `
          & > button,
          & > div {
            width: 50%;
            min-width: 0;
            flex: 1 1 0;
          }

          & > button,
          & > div > button {
            width: 100% !important;
          }
        `}
  }
`;
