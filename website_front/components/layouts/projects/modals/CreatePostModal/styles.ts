import styled, { createGlobalStyle } from "styled-components";

export const CreatePostModalGlobalStyle = createGlobalStyle`
  .create-post-modal .modal-style {
    width: 820px !important;
    border-radius: 8px;
  }

  .create-post-modal .internal-wrapper {
    padding: 40px 48px;
  }

  .create-post-modal .header-wrapper {
    margin-bottom: 38px;
  }

  .create-post-modal .modal-title {
    color: var(--color-text-primary);
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    line-height: 30px;
  }

  .create-post-modal .close-modal-icon {
    padding: 0;
  }

  .create-post-modal .content {
    overflow: visible;
  }

  .create-post-input input,
  .create-post-textarea textarea {
    width: 100%;
    border: 1px solid #e6eaf0;
    background: var(--color-white);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    box-shadow: none;
  }

  .create-post-input input {
    height: 33px;
    padding: 7px 12px;
  }

  .create-post-textarea textarea {
    min-height: 114px;
    padding: 12px;
    resize: none;
  }

  .create-post-input input::placeholder,
  .create-post-textarea textarea::placeholder {
    color: var(--color-text-soft);
    font-size: 14px;
  }

  .create-post-input input:focus,
  .create-post-textarea textarea:focus {
    border-color: var(--color-primary);
    background: var(--color-white);
  }

  .create-post-input p,
  .create-post-textarea p {
    margin: 0 0 10px;
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
  }

  .create-post-input > div,
  .create-post-textarea > div {
    margin-top: 0;
  }

  .create-post-upload .upload-wrapper {
    width: 64px !important;
    max-width: 64px !important;
    min-width: 64px;
    height: 64px !important;
    border: 1px dashed var(--color-text-soft);
    border-radius: 2px;
    background: var(--color-white);
  }

  .create-post-upload .upload-wrapper:hover {
    border-color: var(--color-primary);
    background: #f5fbfd;
  }

  .create-post-upload .upload-wrapper div div {
    display: none;
  }

  .create-post-upload .upload-wrapper svg {
    width: 22px;
    height: 20px;
  }

  @media (max-width: 900px) {
    .create-post-modal .modal-style {
      width: calc(100vw - 32px) !important;
    }

    .create-post-modal .internal-wrapper {
      padding: 28px 24px;
    }
  }
`;

export const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FieldWrapper = styled.div`
  position: relative;
  z-index: 1;

  &:has([aria-expanded="true"]) {
    z-index: 3;
  }
`;

export const FieldLabel = styled.p`
  margin: 0 0 10px;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
`;

export const UploadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const UploadText = styled.p`
  margin: 0;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
`;

export const ActionsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 18px;

  button {
    width: 100%;
    height: 36px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
  }

  .create-post-cancel {
    border: none;
    background: #f9f9f9;
    color: var(--color-text-primary);
  }

  .create-post-cancel:hover,
  .create-post-cancel:active {
    background: #eef1f5;
    color: var(--color-text-primary);
  }

  .create-post-submit {
    border: none;
  }
`;
