import styled from "styled-components";

export const ContentWrapper = styled.div`
  margin-top: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  input {
    background: rgba(245, 249, 253, 0.5);
    border-radius: 8px;
    border: none;
    padding: 8px 12px;
    width: 100%;
  }
`;

export const ImageUploadButton = styled.button`
  width: 100%;
  height: 100px;
  margin-bottom: 24px;
  background: rgba(245, 249, 253, 0.5);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--color-primary);
`;

export const ImageWrapper = styled.div`
  width: 100%;
  margin-bottom: 0;
  background: rgba(245, 249, 253, 0.5);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--color-primary);
  img {
    max-width: 120px;
    width: 100%;
  }
`;

export const RemovePhotoButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-danger);
  border: none;
  background: none;
  padding: 13px 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  justify-content: center;
  width: 100%;
`;
