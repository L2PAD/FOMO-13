import styled from "styled-components";

export const ModalRow = styled.div`
  margin-top: 20px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 17px;
    margin-bottom: 12px;
  }

  textarea {
    padding: 8px;
    width: 100%;
    height: 90px;
    max-height: 200px;
    resize: none;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
  }
`;

export const Input = styled.input`
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: 88px;
  height: 88px;
  cursor: pointer;
`;

export const LabelTest = styled.label`
  cursor: pointer;
  font-family: Gilroy;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`;

export const ImageWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const TextWrapper = styled.div`
  margin-top: 10px;
  height: 500px;
  border: 1px solid rgba(126, 126, 126, 0.204);
`;

export const BorderedButton = styled.button`
  margin-bottom: 15px;
  border: 1px solid rgba(126, 126, 126, 0.204);
  padding: 6px 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
  background: transparent;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(126, 126, 126, 0.1);
  }
  &:active {
    background: rgba(126, 126, 126, 0.2);
  }
`;
