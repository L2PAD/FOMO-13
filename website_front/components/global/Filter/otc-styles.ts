import styled from "styled-components";

export const OtcFilterWrapper = styled.div`
  position: relative;

  & .header-wrapper {
    margin-bottom: 20px;
  }

  @media (max-width: 767px) {
    &.arena {
      width: calc(50% - 6px);
    }
  }
`;

export const OtcDropdown = styled.div<{ active: boolean; right?: boolean }>`
  display: flex !important;
  gap: 80px;
  left: ${({ right }) => (right ? "-140px" : 0)};
  display: ${({ active }) => (active ? "block" : "none")};
  & .otc-checkbox.checkboxes {
    max-width: 300px;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;

    &.ad-mode {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 10px;
      max-width: 100%;
    }
  }

  @media (max-width: 983px) {
    flex-direction: column;
    gap: 0px;
  }
`;

export const OtcDropdownWrapper = styled.div<{
  variant: "big" | "small" | "medium" | "collection";
}>`
  background: white;
  border-radius: 8px;
  width: ${({ variant }) =>
    variant === "small" || variant === "collection" ? "100%" : "auto"};

  & > div {
    padding-bottom: 18px !important;
  }
`;

export const Buttons = styled.div`
  max-width: 390px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 40px;

  button {
    width: 50% !important;
    border-radius: 8px !important;
  }

  .red-btn {
    background: #f9f9f9;
    color: var(--color-danger);
    font-size: 16px;
  }
`;

export const ResetWrapper = styled.div<{
  variant?: "big" | "small" | "medium" | "collection";
}>`
  margin-top: ${({ variant }) =>
    variant === "small" || variant === "collection" ? "20px" : 0};

  &:has(.small) {
    width: 100%;
  }

  .big {
    background: var(--input-hover);
    color: var(--color-text-muted);

    @media (max-width: 480px) {
      &:hover {
        background: var(--input-active);
      }
    }
  }
  .small {
    font-size: 12px;
    width: 100%;
    padding: 0px 10px;
  }
  button {
    width: 180px;
    color: #728094;
    font-size: 14px;
    &.reset-btn {
      width: 100%;
    }
    &:hover {
      color: #464e5aff;
    }

    &:active {
      opacity: 0.6;
      color: #464e5aff;
    }

    @media (max-width: 480px) {
      &:hover {
        background: var(--input-hover);
        color: var(--color-text-muted);
      }
      &:active {
        background: var(--input-active);
        color: var(--color-text-muted);
      }
    }
  }
`;

export const OtcColumn = styled.div`
  width: 100%;
  margin-top: 50px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 35px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const OtcBottom = styled.div<{
  variant: "small" | "big" | "medium" | "collection";
}>`
  margin-top: 20px;
  display: ${({ variant }) =>
    variant === "small" || variant === "collection" ? "flex" : "grid"};
  grid-template-columns: 1fr 0.05fr;
  flex-direction: ${({ variant }) => (variant === "big" ? "none" : "column")};
  width: ${({ variant }) =>
    variant === "small" || variant === "collection" ? "100%" : "auto"};
  gap: ${({ variant }) =>
    variant === "small" || variant === "collection" ? "0px" : "20px"};

  align-items: center;

  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;
