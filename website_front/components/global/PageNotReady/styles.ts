import styled from "styled-components";

export const Wrapper = styled.div`
  position: relative;
  max-width: 75%;
  margin: 120px auto 150px;
  display: flex;
  justify-content: space-between;
`;

export const InfoWrapper = styled.div`
  color: var(--color-text-primary);
  h2 {
    font-family: Inter;
    font-size: 56px;
    font-weight: var(--font-weight-semibold);
    line-height: 67.77px;
  }

  & > div {
    margin: 24px 0 16px;
    font-family: Inter;
    font-size: 36px;
    font-weight: var(--font-weight-regular);
    line-height: 43.57px;
  }

  & > p {
    font-size: 24px;
    font-weight: var(--font-weight-regular);
    line-height: 29.05px;
  }
`;

export const VectorOneWrapper = styled.div`
  position: absolute;
  top: 30px;
  left: -30px;
`;

export const VectorTwoWrapper = styled.div`
  max-width: 50%;
  margin-left: auto;
  transform: translateY(-80px);
  img {
    width: 100%;
    height: auto;
  }
`;

export const EmailWrapper = styled.div`
  margin-top: 80px !important;
`;

export const EmailHeader = styled.div`
  font-family: Inter;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16.94px;
`;

export const InputWrapper = styled.div`
  position: relative;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;

  input {
    max-width: 240px;
    width: 100%;
    background: white;
    padding: 10px 8px;
    border-radius: 8px;
    border: 1px solid #e5e5e5;
    color: var(--color-text-muted);
    transition: background 0.3s ease;
    &:hover {
      background: var(--input-hover);
    }

    &:focus {
      background: var(--input-active);
    }
  }

  button {
    background: var(--color-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    padding: 10px 20px;
    border-radius: 8px;
    color: white;
    transition: background 0.3s ease;

    &:hover {
      background: #39816a;
    }

    &:active {
      background: #2e6a58;
    }
  }
`;

export const CheckboxWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
`;

export const LabelWrapper = styled.div`
  font-size: 10px;
  font-weight: var(--font-weight-regular);
  line-height: 12px;
  a {
    color: var(--color-primary);
    margin-left: 4px;
  }
`;
