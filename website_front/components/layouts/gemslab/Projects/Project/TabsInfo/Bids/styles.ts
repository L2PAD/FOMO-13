import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 584px;
`;

export const Header = styled.div`
  background: rgba(115, 128, 148, 0.05);
  border-radius: 8px 8px 0 0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
`;

export const Cell = styled.div`
  width: 76px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  &:first-child {
    width: 70px;
  }
  &:nth-child(3) {
    width: 120px;
  }
  &:last-child {
    width: 100px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

export const Body = styled.div`
  padding: 0 16px 16px;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 2px solid #f8f8f9;
`;
