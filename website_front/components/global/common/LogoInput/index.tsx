import React, { FC } from "react";
import styled from "styled-components";
import FakeLogo from "../../Icons/FakeLogo";

export const LogoWrapper = styled.div`
  position: relative;
  margin-top: 20px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--main-black);
    margin-bottom: 12px;
  }

  & > div {
    display: flex;
    gap: 12px;
  }

  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: #00c099;
    border: none;
    background: none;
  }

  @media (max-width: 768px) {
    margin-top: 16px;

    & > p {
      font-size: 13px;
      margin-bottom: 8px;
    }

    & > div {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    button {
      font-size: 13px;
    }
  }
`;

export const LogoFakeImage = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 8px;
  background: #f8f8f9;
`;

export const LogoImage = styled.img`
  min-width: 88px;
  min-height: 88px;
  max-width: 88px;
  max-height: 88px;
  border-radius: 8px;
  object-fit: contain;
`;

export const LogoInputLabel = styled.label`
  cursor: pointer;
  font-family: Gilroy, "sans-serif";
  font-size: 14px;
  line-height: 17px;

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 16px;
    margin-top: 4px;
  }
`;

export const LogoInput = styled.input`
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: 88px;
  height: 88px;
  cursor: pointer;
`;

interface IProps {
  logo?: File | string | null;
  onChange: (img: File, name: string) => void;
  label?: string;
  uploadText?: string;
  inputId?: string;
}

const CustomLogoInput: FC<IProps> = ({
  logo,
  onChange,
  label = "Logo",
  uploadText = "Tap to upload a logo (Max 15 MB, PNG/JPG/SVG)",
  inputId = "logo-input",
}) => {
  return (
    <LogoWrapper>
      <p>{label}</p>
      <div>
        {logo ? (
          <LogoImage
            //@ts-ignore
            src={typeof logo === "string" ? logo : URL.createObjectURL(logo)}
            alt="logo"
          />
        ) : (
          <FakeLogo />
        )}
        <LogoInputLabel htmlFor={inputId}>{uploadText}</LogoInputLabel>
        <LogoInput
          id={inputId}
          name="logo"
          type="file"
          onChange={(event: any) => {
            if (event.target.files) {
              onChange(event.target.files[0], "logo");
            }
          }}
        />
      </div>
    </LogoWrapper>
  );
};

export default CustomLogoInput;
