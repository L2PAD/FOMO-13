import styled from "styled-components";

export const ModalRow = styled.div`
  margin-top: 20px;
  margin-bottom: 12px;
`;

export const AddButton = styled.button`
  background: none;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: #05c9a1;
  margin-bottom: 8px;
`;

export const FlagRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }

  input {
    background: #f8f8f9;
    border-radius: 8px;
    padding: 10px;
    max-width: 505px;
    width: 100%;
    border: none;
  }
`;

export const DeleteButton = styled.div`
  cursor: pointer;
  width: 20px;
  height: 20px;
  border: 1px solid var(--color-danger);
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 6px;
  }
`;

export const FlagForm = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 20px;
`;

export const FlagField = styled.label`
  display: grid;
  gap: 6px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 13px;
    line-height: 16px;
    color: var(--color-text-primary);
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #edf0f4;
    border-radius: 8px;
    background: #f8f8f9;
    padding: 10px 12px;
    font-size: 14px;
    line-height: 18px;
    color: var(--color-text-primary);
    outline: none;
  }

  textarea {
    min-height: 108px;
    resize: vertical;
  }
`;

export const FlagHint = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 18px;
`;
