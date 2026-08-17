import React from "react";
import styled from "styled-components";

export const RootWrapper = styled.label<{ labelOrientation: "left" | "top" }>`
  display: ${({ labelOrientation }) =>
    labelOrientation === "left" ? "flex" : "block"};
  width: ${({ labelOrientation }) =>
    labelOrientation === "left" ? "100%" : "max-content"};
  justify-content: space-between;
  align-items: center;

  &.width100 {
    width: 100%;

    input{
      width: 100%;
    }
  }

  &.nav-search {
    max-width: 100%;
    width: 100%;
    border-radius: 8px;
    input {
      max-width: 100%;
      width: 100% !important;
      font-size: 14px; 
      height: 36px;
      &::placeholder {
        font-size: 14px;
        color: var(--color-text-soft);
      }
    }

  }
`;

export const LabelWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const ErrorStyle = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  color: var(--color-danger);
  margin: 0;
  padding: 0;
`;

export const LabelStyle = styled.p<{ labelOrientation: "left" | "top" }>`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin: 0;
  padding: 0;
  margin-top: ${({ labelOrientation }) =>
    labelOrientation === "left" ? 7 : 0};
`;

export const InputWrapper = styled.div<{ labelText?: React.ReactNode }>`
  position: relative;
  margin-top: ${({ labelText }) => (labelText ? 7 : 0)};

  @media (max-width: 768px) {
    svg {
      width: 16px !important;
      height: 16px !important;
    }
  }
`;

export const InputStyle = styled.input<{ withIcon: boolean }>`
  border: none;
  background: #f9f9f9;
  border-radius: 8px;
  padding: ${({ withIcon }) =>
    withIcon ? "10px 12px 10px 36px" : "10px 12px"};
  box-sizing: border-box;
  font-weight: var(--font-weight-semibold);
  width: 266px;
  max-width: 100%;
  transition: all 0.3s ease;
  &:hover {
    background: var(--input-hover);
  }
  &:focus {
    background: var(--input-active);
  }
  &::placeholder {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 1.5;
    color: var(--color-text-soft);
  }
  &:disabled {
    opacity: 0.9;
    background: #e3e3e3 !important;
    cursor: not-allowed;
  }

  &.flags-input {
    background-color: white;
    width: 100%;
    height: 33px;
  }
`;

export const InputHelpText = styled.span<{ focus: boolean }>`
  color: rgba(115, 128, 148, 0.5);
  font-weight: var(--font-weight-medium);
  font-size: 14px;
  line-height: 16px;
  position: absolute;
  right: 12px;
  top: ${({ focus }) => (focus ? "110%" : "25%")};
  margin: 0;
  padding: 0;
  transition: 0.3s;
`;

export const RightLabel = styled.div`
  position: absolute;
  top: 11px;
  right: 12px;

  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0%;
  color: var(--main-gray);
`;
