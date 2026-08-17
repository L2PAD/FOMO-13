import styled from "styled-components";

export const Description = styled.div`
  margin-top: 12px;
  margin-bottom: 20px;
  font-size: 16px;
`;

export const ThemeWrapper = styled.div`
  margin-bottom: 20px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
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
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
  }
`;

export const SelectWrapper = styled.div<{ open: boolean }>`
  position: relative;

  & > div:first-child {
    position: relative;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    transition: 0.3s;
    height: 32px;

    svg {
      transition: 0.3s;
      position: absolute;
      top: 15px;
      right: 12px;
      transform: rotate(${({ open }) => (open ? "180deg" : "0")});
    }
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
    font-weight: var(--font-weight-semibold);
  }
`;

export const MessageWrapper = styled.div`
  margin-bottom: 20px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
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

export const FileWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    width: 200px;
  }
  button {
    background: none;
    border: none;
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    text-align: center;
    color: var(--color-primary);
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
  &:disabled {
    background: var(--color-primary);
    cursor: not-allowed;
  }
`;

export const UploadedFileWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
`;

export const ProjectItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  padding: 6px 4px;
  border-radius: 8px;
  &:hover {
    background: rgba(4, 165, 132, 0.25);
  }

  img {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }
`;
export const SelectedProject = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  cursor: pointer;

  img {
    width: 20px;
    height: 20px;
    border-radius: 8px;
  }
`;
