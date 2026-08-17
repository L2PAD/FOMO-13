import styled from "styled-components";
import Button from "../../common/Button";

export const ModalRow = styled.div`
  margin-top: 20px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }

  textarea {
    background: #f8f8f9;
    border-radius: 8px;
    padding: 9px 12px;
    width: 100%;
    height: 105px;
    resize: none;
    border: none;
    margin-top: 7px;
  }
`;

export const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: 24px;
`;

export const RemoveButton = styled(Button)`
  margin-top: 24px;
  width: 100%;
  background: #dc143c !important;
`;
