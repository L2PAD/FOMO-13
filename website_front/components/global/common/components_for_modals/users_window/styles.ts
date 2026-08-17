import styled from "styled-components";

export const Wrapper = styled.div`
  padding: 8px 20px 8px 8px;
  background: #f8f8f9;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  max-height: 223px;
  min-height: 40px;
  overflow-y: auto;
`;

export const UserRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  width: 100%;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px 13px 16px 10px;
  margin-bottom: 6px;
`;

export const UserData = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;

  img {
    width: 32px;
    height: 32px;
    border-radius: 100px;
  }
`;

export const DeleteButton = styled.button`
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-danger);
  background: none;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
