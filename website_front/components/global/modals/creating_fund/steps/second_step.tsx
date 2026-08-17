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
  StatusWrapper,
  LogoInput,
  FundingWrapper,
} from "../styles";
import SearchCountry from "../../../SearchCountry";
import { ICountry } from "../../../GlobalMap";
import CustomSelect from "../../../common/CustomSelect";
import ModalDatePicker from "../../../common/components_for_modals/modal_date_picker";
import { ModalRow } from "../../creating_project/styles";
import ProjectsSearch from "../../../common/ProjectsSearch";

const SecondStep: FC<IStepProps> = ({ data, inputsHandler }) => {
  const [status, setStatus] = useState("Active");

  const statusHandler = (statusValue: string): void => {
    setStatus(statusValue);
    inputsHandler(statusValue, "status");
  };

  return (
    <div>
      <ModalRow>
        <InputWithLabel
          type={"number"}
          label="Total Investment Amount (USD)"
          placeholder="Enter total invested amount"
          value={data.investAmount}
          onChange={(value) => inputsHandler(value, "investAmount")}
        />
      </ModalRow>
      <ModalRow>
        <p>Portfolio Projects</p>
        <ProjectsSearch
          placeholder="Search and select projects this fund has invested in"
          projects={data.projects || []}
          onChange={(projects: Array<IProject>) =>
            inputsHandler(projects, "projects")
          }
        />
      </ModalRow>
      <FundingWrapper>
        <p>Year Funded</p>
        <input
          className="date-input"
          type={"date"}
          placeholder="mm.dd.yy"
          onChange={(e: any) => inputsHandler(e.target.value, "foundedDate")}
          value={String(data?.foundedDate || new Date())}
        />
        <svg
          className="calendar-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="13"
          viewBox="0 0 12 13"
          fill="none"
        >
          <path
            d="M1.16667 4.44284H10.5M2.37302 0.5V1.52869M9.16667 0.5V1.52857M11.1667 3.32857V10.7C11.1667 11.6941 10.3707 12.5 9.38889 12.5H2.27778C1.29594 12.5 0.5 11.6941 0.5 10.7V3.32857C0.5 2.33445 1.29594 1.52857 2.27778 1.52857H9.38889C10.3707 1.52857 11.1667 2.33445 11.1667 3.32857Z"
            stroke="#738094"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </FundingWrapper>
      <ModalRow>
        <p>Region</p>
        <SearchCountry
          className="modal-search"
          selectedCountry={data.regionData || null}
          onChange={(value: ICountry) => inputsHandler(value, "regionData")}
        />
      </ModalRow>
    </div>
  );
};

export default SecondStep;
