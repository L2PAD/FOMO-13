import React, { FC } from "react";
import styled from "styled-components";
import { InputError } from "../../../layouts/projects/modals/CreatePortfolio/styles";

export const Wrapper = styled.div`
  margin-top: 20px;

  & .text-label {
    margin-top: 12px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 17px;
    color: var(--main-black);
    margin-bottom: 12px;
  }

  textarea {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    min-height: 75px;
    transition: background 0.3s ease;

    &::placeholder {
      color: #b5bcc7;
    }

    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
    &::placeholder {
      color: rgba(115, 128, 148, 0.5);
      font-weight: var(--font-weight-medium);
      font-size: 14px;
      line-height: 16px;
    }
    &:disabled {
      opacity: 0.9;
      background: #e3e3e3;
      cursor: not-allowed;
    }
  }

  @media (max-width: 768px) {
    margin-top: 16px;

    & .text-label {
      margin-top: 8px;
      font-size: 12px;
    }

    & > p {
      font-size: 14px;
      margin-bottom: 8px;
    }

    textarea {
      padding: 10px;
      font-size: 13px;
      min-height: 60px;

      &::placeholder {
        font-size: 13px;
      }
    }
  }
`;

interface IProps {
  value: string;
  maxCharacters?: number;
  isMaxCharacters?: boolean;
  label?: string;
  placeholder?: string;
  isError?: boolean;
  errorText?: string;
  onChange: (value: string) => void;
}

const CustomTextarea: FC<IProps> = ({
  value,
  maxCharacters,
  isMaxCharacters = false,
  label,
  onChange,
  placeholder = "Enter project description",
  isError,
  errorText,
}) => {
  return (
    <Wrapper>
      {label ? <p>{label}</p> : <></>}
      <textarea
        value={value}
        onChange={(e: any) => {
          if (e.target.value.length > 300) return;

          onChange(e.target.value);
        }}
        placeholder={placeholder}
      />
      {isError ? (
        <InputError style={{ marginTop: "12px" }}>{errorText}</InputError>
      ) : (
        <></>
      )}
      {isMaxCharacters ? (
        <div className="text-label">{maxCharacters || 0} Characters Max</div>
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default CustomTextarea;
