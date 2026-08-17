/* eslint-disable */
import React, { FC } from "react";
import { FundingWrapper, InvestorsHeader, ModalRow } from "../styles";
import InputWithLabel from "../../../common/components_for_modals/input_with_label";
import ModalDatePicker from "../../../common/components_for_modals/modal_date_picker";
import UsersWindow from "../../../common/components_for_modals/users_window";
import { IStepProps } from "..";
import SearchCountry from "../../../SearchCountry";
import { ICountry } from "../../../GlobalMap";

const SecondStep: FC<IStepProps> = ({
  data,
  inputsHandler,
  openInvestorsModal,
  investorsHandler,
}) => {
  return (
    <div>
      <ModalRow>
        <InputWithLabel
          type={"number"}
          placeholder="Enter total raised amount"
          label="Total Raised Investments (USD)"
          value={data.totalRaised}
          onChange={(value) => inputsHandler(value, "totalRaised")}
        />
      </ModalRow>
      <FundingWrapper>
        <p>Last Funding</p>
        <ModalDatePicker
          date={data.lastFunding}
          onChange={(value) => inputsHandler(value, "lastFunding")}
        />
      </FundingWrapper>

      <ModalRow>
        <InvestorsHeader>
          <p>Investors</p>
          <button onClick={openInvestorsModal}>+ Add</button>
        </InvestorsHeader>
        <UsersWindow
          investors={data.investors}
          dataHandler={investorsHandler}
        />
        <ModalRow>
          <p>Location</p>
          <SearchCountry
            className="modal-search"
            selectedCountry={data.regionData || null}
            onChange={(value: ICountry) => inputsHandler(value, "regionData")}
          />
        </ModalRow>
      </ModalRow>
    </div>
  );
};

export default SecondStep;
