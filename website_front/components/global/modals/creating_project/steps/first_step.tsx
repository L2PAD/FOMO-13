/* eslint-disable */
import React, { FC, useState } from "react";
import InputWithLabel from "../../../common/components_for_modals/input_with_label";
import RadioButton from "../../../common/radio_button";
import { IProject } from "../../../../../types/global_types";
import { IStepProps } from "..";
import {
  LogoFakeImage,
  LogoImage,
  LogoInputLabel,
  LogoWrapper,
  ModalRow,
  StatusWrapper,
  LogoInput,
} from "../styles";
import FakeLogo from "../../../Icons/FakeLogo";

const FirstStep: FC<IStepProps> = ({
  data,
  validationErrors,
  inputsHandler,
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
          placeholder="Enter project name"
          isError={validationErrors?.includes("name")}
          errorText="Oops! Looks like your project needs a name. Give it a title to continue!"
          label="Project name"
          value={data.name}
          onChange={(value) => inputsHandler(value, "name")}
        />
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          placeholder="Enter category (e.g., DeFi, Web3, AI)"
          isError={validationErrors?.includes("niche")}
          errorText="Oops! Looks like your project needs a category. Give it a title to continue!"
          label="Category"
          value={data.niche}
          onChange={(value) => inputsHandler(value, "niche")}
        />
      </ModalRow>
      <StatusWrapper>
        <p>Activity Status</p>
        <RadioButton
          infoText="Currently running and operational"
          isInfoButton={true}
          label="Active"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
        <RadioButton
          infoText="Planned and launching soon"
          isInfoButton={true}
          label="Upcoming"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
        <RadioButton
          infoText="Completed or no longer active"
          isInfoButton={true}
          label="Ended"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
        <RadioButton
          infoText="Recently created, still in early stages"
          isInfoButton={true}
          label="New"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
      </StatusWrapper>
      <LogoWrapper>
        <p>Logo</p>
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
            Tap to upload a logo (Max 15 MB, PNG/JPG/SVG)
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
