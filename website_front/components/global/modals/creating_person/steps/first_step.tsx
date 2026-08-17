/* eslint-disable */
import React, { FC, useState } from "react";
import InputWithLabel from "../../../common/components_for_modals/input_with_label";
import RadioButton from "../../../common/radio_button";
import { IProject } from "../../../../../types/global_types";
import { IStepProps } from "..";
import { LogoFakeImage, ModalRow, StatusWrapper } from "../styles";
import SearchCountry from "../../../SearchCountry";
import { ICountry } from "../../../GlobalMap";
import FakeLogo from "../../../Icons/FakeLogo";
import {
  LogoImage,
  LogoInput,
  LogoInputLabel,
  LogoWrapper,
} from "../../creating_project/styles";

const FirstStep: FC<IStepProps> = ({
  data,
  inputsHandler,
  validationErrors,
}) => {
  const [status, setStatus] = useState("Active");

  const statusHandler = (statusValue: string): void => {
    setStatus(statusValue);
    inputsHandler(statusValue, "status");
  };

  return (
    <div>
      <ModalRow>
        <InputWithLabel
          label="Person name"
          placeholder="Enter person name"
          isError={validationErrors?.includes("name")}
          errorText="Oops! Looks like your person needs a name. Give it a title to continue!"
          value={data.name}
          onChange={(value) => inputsHandler(value, "name")}
        />
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          placeholder="Enter category (e.g., DeFi, Web3, AI)"
          isError={validationErrors?.includes("niche")}
          errorText="Oops! Looks like your person needs a category. Give it a title to continue!"
          label="Category"
          value={data.niche}
          onChange={(value) => inputsHandler(value, "niche")}
        />
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          placeholder="Enter company (Optional)"
          label="Сompany"
          value={data.company}
          onChange={(value) => inputsHandler(value, "company")}
        />
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          placeholder="Enter position (e.g., CEO, Partner, Advisor)"
          label="Position"
          value={data.position}
          onChange={(value) => inputsHandler(value, "position")}
        />
      </ModalRow>
      <LogoWrapper>
        <p>Avatar</p>
        <div>
          {data.logo ? (
            <LogoImage
              //@ts-ignore
              src={URL.createObjectURL(data?.logo)}
              alt="logo"
            />
          ) : (
            <FakeLogo />
          )}
          <LogoInputLabel htmlFor="logo-input">
            Tap to upload a avatar (Max 15 MB, PNG/JPG/SVG)
          </LogoInputLabel>
          <LogoInput
            id="logo-input"
            name="logo"
            type="file"
            onChange={(event: any) => {
              if (event.target.files) {
                inputsHandler(event.target.files[0], "logo");
              }
            }}
          />
        </div>
      </LogoWrapper>
    </div>
  );
};

export default FirstStep;
