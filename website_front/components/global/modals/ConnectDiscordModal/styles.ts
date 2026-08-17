import styled from "styled-components";

export const ContentWrapper = styled.div`
  margin-top: 24px;
  gap: 8px;
  display: flex;
  flex-direction: column;

  p {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .check-zone {
    display: flex;
    font-size: 12px;
    align-items: center;
  }

  .success-button {
    font-size: 20px;
    height: 48px;
    margin-top: 20px;
  }
`;

export const ButtonWrapper = styled.button<{
  variant?: "default" | "success" | "error";
}>`
  background: #f5f9fd;
  border: 1px solid
    ${({ variant }) =>
      variant === "default"
        ? "rgba(83, 98, 124, 0.07)"
        : variant === "success"
          ? "#05C9A1"
          : variant === "error"
            ? "#FF507D"
            : "#F5F9FD"};
  border-radius: 18px;
  padding: 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  cursor: pointer;
`;

export const ButtonContentWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;

  span {
    font-weight: var(--font-weight-medium);
    font-size: 18px;
    line-height: 21px;
    color: var(--color-text-primary);
  }
`;

export const ImageContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-direction: column;
  font-weight: var(--font-weight-semibold);
  padding-top: 35px;
  padding-bottom: 35px;

  p {
    font-size: 24px;
  }

  span {
    font-size: 20px;
    display: flex;
    align-items: center;
    color: #777777e8;
    gap: 2px;
  }
`;
export const Buttons = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;

  button {
    width: 100%;
  }
`;
