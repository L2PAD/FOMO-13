import styled from "styled-components";

export const CheckboxesWrapper = styled.div`
  margin-top: 20px;
  background: #f5fbfd;
  padding: 20px;
  border-radius: 12px;
  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    margin-bottom: 12px;
  }

  & > div {
    display: flex;
    flex-direction: column;
    gap: 12px;

    p {
      font-weight: var(--font-weight-regular);
    }
  }
`;

export const TablesWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f5fbfd;
  padding: 20px;
  border-radius: 12px;
`;

export const TableRow = styled.div`
  background: white;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: grab;
  box-shadow: 2px 2px 8px 2px #00053014;
  & > button {
    padding: 0;
    border: none;
    background: none;
    margin-right: 8px;

    svg {
      width: 8px;
      height: 8px;
    }
  }

  & > div:first-child {
    display: flex;
    align-items: center;

    svg:first-child {
      margin-right: 3px;
    }

    p {
      margin-left: 8px;
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 16px;
      color: black;
    }
  }
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  button {
    padding: 13px;
    border-radius: 8px;
    border: none;
    width: 100%;
    transition: 0.3s;

    &:first-child {
      background: var(--color-primary-soft);
      font-weight: var(--font-weight-semibold);
      font-size: 18px;
      line-height: 22px;
      color: var(--color-primary);

      &:hover {
        background: rgba(4, 165, 132, 0.15);
      }
    }

    &:last-child {
      background: var(--color-primary);
      font-weight: var(--font-weight-semibold);
      font-size: 18px;
      line-height: 22px;
      color: var(--color-white);

      &:hover {
        background: rgba(4, 165, 132, 0.75);
      }
    }
  }
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RightColumn = styled.div``;
