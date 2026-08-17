import styled from "styled-components";

export const Wrapper = styled.div``;

export const Tabs = styled.div`
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    margin: 16px 0;
    gap: 12px;
    flex-wrap: wrap;
  }
`;

export const Tab = styled.button<{ isActive: boolean }>`
  padding: 6px 10px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19.6px;
  letter-spacing: 0%;
  text-align: center;
  border-radius: 4px;
  background: ${({ isActive }) => (isActive ? "#F5FBFD" : "#F9F9F9")};
  color: ${({ isActive }) => (isActive ? "var(--color-primary)" : "var(--color-text-primary)")};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 5px 8px;
    font-size: 14px;
    line-height: 17px;
  }
`;

export const TabsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }
`;
