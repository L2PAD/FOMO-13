/* eslint-disable */
import React, { FC, useState } from "react";
import InputWithLabel from "../../../common/components_for_modals/input_with_label";
import RadioButton from "../../../common/radio_button";
import { IProject } from "../../../../../types/global_types";
import { IStepProps } from "..";
import SearchCountry from "../../../SearchCountry";
import { ICountry } from "../../../GlobalMap";
import CustomSelect from "../../../common/CustomSelect";
import {
  LogoImage,
  LogoInput,
  LogoInputLabel,
  LogoWrapper,
  ModalRow,
  StatusWrapper,
} from "../../creating_project/styles";
import FakeLogo from "../../../Icons/FakeLogo";

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
          isError={validationErrors?.includes("name")}
          errorText="Oops! Looks like your fund needs a name. Give it a title to continue!"
          label="Fund name"
          value={data.name}
          placeholder="Enter the full name of the fund"
          onChange={(value) => inputsHandler(value, "name")}
        />
      </ModalRow>
      <ModalRow style={{ width: "50%" }}>
        <p>Fund type</p>
        <CustomSelect
          placeholder="Select Type"
          options={[
            {
              value: "Venture Capital (VC)",
              label: "Venture Capital (VC)",
            },
            {
              value: "Accelerator / Incubator",
              label: "Accelerator / Incubator",
            },
            {
              value: "Private Equity",
              label: "Private Equity",
            },
            {
              value: "Hedge Fund",
              label: "Hedge Fund",
            },
            {
              value: "DAO Investment Fund",
              label: "DAO Investment Fund",
            },
            {
              value: "Angel Investors",
              label: "Angel Investors",
            },
          ]}
          onChange={(value: string) => inputsHandler(value, "niche")}
        />
      </ModalRow>
      <ModalRow style={{ width: "50%" }}>
        <p>Industry Focus</p>
        <CustomSelect
          placeholder="Select Category"
          options={[
            {
              value: "DeFi",
              label: "DeFi",
            },
            {
              value: "Metaverse",
              label: "Metaverse",
            },
            {
              value: "Blockchain & Crypto",
              label: "Blockchain & Crypto",
            },
            {
              value: "AI & Web3",
              label: "AI & Web3",
            },
            {
              value: "Layer 1 / Layer 2",
              label: "Layer 1 / Layer 2",
            },
            {
              value: "NFT & Gaming",
              label: "NFT & Gaming",
            },
            {
              value: "Infrastructure",
              label: "Infrastructure",
            },
            {
              value: "Other",
              label: "Other",
            },
          ]}
          onChange={(value: string) => inputsHandler(value, "industryFocus")}
        />
      </ModalRow>
      <StatusWrapper>
        <p>Activity Status</p>
        <RadioButton
          infoText="Currently active and making investments"
          isInfoButton={true}
          label="Active"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
        <RadioButton
          infoText="No recent activity or paused operations"
          isInfoButton={true}
          label="Inactive"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
        <RadioButton
          infoText="No longer operating or dissolved"
          isInfoButton={true}
          label="Defunct"
          value={status}
          onChange={(value) => statusHandler(value)}
        />
        <RadioButton
          infoText="Operating privately without public investment data"
          isInfoButton={true}
          label="Stealth / Undisclosed"
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
