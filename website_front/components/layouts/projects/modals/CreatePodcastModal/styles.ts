import styled from "styled-components";

export const Description = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
`;

export const DateWrapper = styled.div`
  margin-bottom: 16px;

  div {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }

  input {
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }

  input::-webkit-calendar-picker-indicator {
    display: none;
  }
`;

export const ThemeWrapper = styled.div`
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  input {
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const ProjectsWrapper = styled.div`
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const DropdownWrapper = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  position: absolute;
  top: 30px;
  width: 100%;
  left: 0;
  max-height: 200px;
  height: max-content;
  overflow-y: auto;
  border: 1px solid rgba(83, 98, 124, 0.07);

  div {
    cursor: pointer;
    margin-bottom: 10px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const MessageWrapper = styled.div`
  margin-bottom: 16px;
  width: 100%;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }

  textarea {
    width: 100%;
    height: 105px;
    background: #f8f8f9;
    border-radius: 8px;
    resize: none;
    border: none;
    padding: 8px 12px;
  }
`;

export const SubmitButton = styled.button`
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
`;
