import styled from "styled-components";

export const LeaguesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-top: 40px;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

export const LeaguesTableWrapper = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const LeaguesTableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const LeaguesTableSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #dbe2ea;
  background: var(--color-white);
  flex: 1;

  input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    color: #0f172a;

    &::placeholder {
      color: #94a3b8;
    }
  }
`;

export const LeaguesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--color-white);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  table-layout: fixed;
  min-width: 800px;
`;

export const LeaguesTableHead = styled.thead`
  border-bottom: 1px solid #f0f2f5;
  min-width: 800px;

  th {
    padding: 10px;
    text-align: left;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }
`;

export const LeaguesTableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #f0f2f5;
    transition: background-color 0.2s ease;
    display: table-row;
    vertical-align: middle;

    &:hover {
      background-color: #f9fbfc;
    }

    &:last-child {
      border-bottom: none;
    }

    td {
      padding: 0 10px;
      font-size: 14px;
      color: #0f172a;
      vertical-align: middle;
      height: 68px;
      display: table-cell;
    }
  }
`;

export const LeaguesRank = styled.td`
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68px;
  padding: 0 10px;
`;

export const LeaguesUserCell = styled.td`
  display: flex;
  align-items: center;
  gap: 12px;
  vertical-align: middle;
  height: 60px;
  padding: 0 10px;
  width: 250px;
`;

export const LeaguesUserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

export const LeaguesUserName = styled.div`
  font-weight: var(--font-weight-medium);
  color: #0f172a;
`;

export const LeaguesMetric = styled.td<{ positive?: boolean }>`
  font-weight: var(--font-weight-medium);
  color: ${({ positive }) => (positive ? "var(--color-primary)" : "#0f172a")};
  display: table-cell;
  vertical-align: middle;
  height: 60px;
  padding: 0 10px;

  > div {
    height: 100%;
    display: flex;
    align-items: center;
  }
`;

export const LeaguesAccuracyBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  height: 100%;

  .bar {
    width: 50px;
    height: 4px;
    background: #e3e8ef;
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    align-items: center;

    .fill {
      height: 100%;
      background: linear-gradient(-90deg, var(--color-primary) 0%, #06d4a9 100%);
      border-radius: 3px;
    }
  }

  .percent {
    min-width: 40px;
    text-align: right;
    font-weight: var(--font-weight-medium);
    color: #0f172a;
  }
`;

export const LeaguesActionsCell = styled.td`
  display: flex;
  align-items: center;
  gap: 10px;
  vertical-align: middle;
  height: 60px;
  padding: 0 10px;
  width: 200px !important;
  min-width: 200px;
  max-width: 200px;
`;

export const LeaguesActionButton = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #dbe2ea;
  background: var(--color-white);
  color: #0f172a;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-surface-subtle);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.challenge {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-white);
    margin-left: 10px;

    &:hover {
      background: #038a6a;
      border-color: #038a6a;
    }
  }
`;

export const LeaguesSnapshotCardSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 40px;
  height: fit-content;
`;

export const LeaguesSnapshotCard = styled.div`
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .label {
    opacity: 1;
  }
`;
