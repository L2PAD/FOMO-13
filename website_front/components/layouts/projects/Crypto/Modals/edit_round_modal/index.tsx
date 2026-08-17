import React, { useState, FC, useEffect } from "react";
import { IFundingRound, IProject } from "../../../../../../types/global_types";
import MainModal from "../../../../../global/common/MainModal";
import InvestorsSearch from "../../../../../global/common/InvestorsSearch";
import CustomSelect from "../../../../../global/common/CustomSelect";
import CustomNumberInput from "../../../../../global/common/components_for_modals/custom_number_input";
import ModalDatePicker from "../../../../../global/common/components_for_modals/modal_date_picker";
import InputWithLabel from "../../../../../global/common/components_for_modals/input_with_label";
import CurrenciesDropdown, {
  ICurrency,
} from "../../../../../global/common/CurrenciesDropdown";
import {
  currenciesList,
  investingRounds,
} from "../../../../../../staticContent/global";
import { FundingWrapper } from "../../../../../global/modals/creating_fund/styles";
import { HeaderWrapper, ModalRow } from "../add_round_modal/styles";
import {
  Actions,
  ResetButton,
} from "../../../../../global/UniversalFilter/styles";
import { Action } from "../../../../../global/LeftNav/styles";
import Button from "../../../../../global/common/Button";
import { InputError } from "../../../modals/CreateOwnAsset/styles";
import { defaultState } from "../add_round_modal";

interface Props {
  project?: IProject | null;
  round: IFundingRound | null;
  index: number | null;
  onChange: (updatedRounds: Array<IFundingRound>) => void;
  onClose: () => void;
  isEditModal: boolean;
}

const EditRoundModal: FC<Props> = ({
  project,
  round,
  index,
  onChange,
  onClose,
  isEditModal,
}) => {
  const [data, setData] = useState<IFundingRound>(round ?? defaultState);
  const [currencySearch, setCurrencySearch] = useState("");
  const [errors, setErrors] = useState<Array<string>>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const inputsHandler = (value: any, name?: string): void => {
    if (!name) return;
    setData({ ...data, [name]: value });
  };

  const currenciesHandler = (item: ICurrency): void => {
    const isIncludes = !!data.currenciesList.find(
      (currency) => currency.name === item.name
    );
    const updatedCurrencies = isIncludes
      ? data.currenciesList.filter((currency) => currency.name !== item.name)
      : [item, ...data.currenciesList];

    setData({ ...data, currenciesList: updatedCurrencies });
  };

  const validateFundingRound = (data: IFundingRound): string[] => {
    const requiredFields: (keyof IFundingRound)[] = [
      "type",
      "goal",
      "raised",
      "startDate",
      "endDate",
      "platformName",
    ];
    const invalidFields = requiredFields.filter((field) => !data[field]);
    setTimeout(() => setErrors([]), 4000);
    return invalidFields;
  };

  const confirmChanges = () => {
    const invalidFields = validateFundingRound(data);
    if (invalidFields.length > 0) {
      setErrors(invalidFields);
      return;
    }

    const updatedRounds = [...(project?.fundraising || [])];
    updatedRounds[currentIndex] = data;

    onChange(updatedRounds);
    onClose();
  };

  useEffect(() => {
    if (typeof index === "number") setCurrentIndex(index);
  }, [index]);

  useEffect(() => {
    setData(round ?? defaultState);
  }, [round]);

  return (
    <MainModal
      className="share-modal"
      isVisible={!!isEditModal}
      title={`Edit Funding Round - ${round?.type}`}
      onClose={onClose}
      variant="820"
    >
      <ModalRow style={{ marginTop: "20px" }}>
        <p style={{ marginBottom: "12px" }}>Investors</p>
        <InvestorsSearch
          className="light-gray"
          investors={data.investors}
          onChange={(investors) => setData({ ...data, investors })}
        />
      </ModalRow>

      <HeaderWrapper>
        <ModalRow>
          <p>Round Type</p>
          <CustomSelect
            placeholder="Select investing round"
            onChange={(value) => setData({ ...data, type: value })}
            options={[]}
            optionsWithSection={investingRounds}
          />
          {errors.includes("type") && (
            <InputError style={{ marginTop: "12px" }}>
              Missing round type
            </InputError>
          )}
        </ModalRow>

        <CustomNumberInput
          icon="dollar"
          type="text"
          name="tokenPrice"
          placeholder="Enter token price"
          label="Price"
          value={data.tokenPrice}
          onChange={inputsHandler}
        />

        <CustomNumberInput
          icon="dollar"
          name="goal"
          placeholder="Enter goal amount"
          label="Funds Goal"
          value={data.goal || 0}
          isError={errors.includes("goal")}
          errorText="Please enter the funding goal for this round"
          onChange={inputsHandler}
        />

        <CustomNumberInput
          icon="dollar-right"
          name="raised"
          placeholder="Enter amount already raised"
          label="Funds Raised"
          value={data.raised || 0}
          isError={errors.includes("raised")}
          errorText="Enter the amount raised so far"
          onChange={inputsHandler}
        />

        <FundingWrapper>
          <p>Start Date</p>
          <ModalDatePicker
            type="small"
            date={data.startDate}
            onChange={(value) => inputsHandler(value, "startDate")}
          />
          {errors.includes("startDate") && (
            <InputError style={{ marginTop: "12px" }}>Pick a date</InputError>
          )}
        </FundingWrapper>

        <FundingWrapper>
          <p>End Date</p>
          <ModalDatePicker
            type="small"
            date={data.endDate}
            onChange={(value) => inputsHandler(value, "endDate")}
          />
          {errors.includes("endDate") && (
            <InputError style={{ marginTop: "12px" }}>Pick a date</InputError>
          )}
        </FundingWrapper>

        <CustomNumberInput
          icon="dollar"
          name="preValuation"
          placeholder="Enter pre-valuation"
          label="Pre-Valuation"
          value={data.preValuation}
          onChange={inputsHandler}
        />

        <InputWithLabel
          placeholder="Solana"
          type="text"
          name="platformName"
          label="Platform"
          isError={errors.includes("platformName")}
          value={String(data.platformName)}
          errorText="Specify the platform"
          onChange={(value) => setData({ ...data, platformName: value })}
        />
      </HeaderWrapper>

      <CurrenciesDropdown
        className="marginTop"
        label="Accepted Currencies"
        placeholder="Search currency or select"
        options={currenciesList}
        values={data.currenciesList || []}
        onChange={currenciesHandler}
        searchValue={currencySearch}
        onSearch={setCurrencySearch}
      />

      <HeaderWrapper style={{ marginTop: "20px" }}>
        <CustomNumberInput
          icon="SRC"
          name="tokenAllocated"
          placeholder="Enter number of tokens allocated"
          label="Tokens Allocated"
          value={data.tokenAllocated || 0}
          onChange={inputsHandler}
          isPrice={false}
        />
        <FundingWrapper>
          <p>Unlock Date</p>
          <ModalDatePicker
            type="small"
            date={data.unlockDate}
            onChange={(value) => inputsHandler(value, "unlockDate")}
          />
        </FundingWrapper>
      </HeaderWrapper>

      <Actions style={{ marginTop: "20px" }}>
        <Action onClick={onClose} actionType="red">
          Cancel
        </Action>
        <Button onClick={confirmChanges} variant="primary">
          Save Changes
        </Button>
      </Actions>

      <ResetButton>
        <button onClick={() => setData(round ?? defaultState)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="12"
            viewBox="0 0 13 12"
            fill="none"
          >
            <path
              d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Reset</span>
        </button>
      </ResetButton>
    </MainModal>
  );
};

export default EditRoundModal;
