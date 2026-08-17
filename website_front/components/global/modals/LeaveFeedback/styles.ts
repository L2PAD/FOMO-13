import styled from "styled-components";

export const TitleModal = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 29.02px;
`;

export const Actions = styled.div`
  margin: 12px 0px 20px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
`;

export const ActionItem = styled.button`
  padding: 34px;
  background: #f8f8f9;
  border-radius: 8px;
  transition: all 0.3s ease;
  img {
    max-width: 80px;
    height: auto;
  }

  &:hover {
    background: #e3e3e3;
  }

  &:active {
    opacity: 0.8;
  }
`;

export const Row = styled.div`
  margin-top: 40px;

  textarea {
    background: #f8f8f9;
    border: none;
    padding: 8px 10px;
    border-radius: 8px;
    max-width: 100%;
    min-width: 100%;
    min-height: 100px;
    font-family: inherit;
  }
`;

export const ButtonWrapper = styled.div`
  width: 100%;
  margin: 40px auto 0;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;

  button {
    max-width: 50%;
    width: 50%;
  }
`;

export const Label = styled.div`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 8px;
`;
