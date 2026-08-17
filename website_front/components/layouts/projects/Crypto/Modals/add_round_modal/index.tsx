import React, { useState, FC, useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../../../../global/common/Button";
import { IProject, IFundingRound } from "../../../../../../types/global_types";
import updateProject from "../../../../../../http/projects/updateProject";
import InputWithLabel from "../../../../../global/common/components_for_modals/input_with_label";
import useProjectPath from "../../../../../../hooks/useProjectPath";
import { DateInputsWrapper } from "../../../../gemslab/modals/CustomAssetModal/styles";
import ModalDatePicker from "../../../../../global/common/components_for_modals/modal_date_picker";

import { FundingWrapper } from "../../../../../global/modals/creating_fund/styles";
import {
  AddButton,
  AddRoundBtn,
  FlagRow,
  HeaderRow,
  HeaderWrapper,
  ModalRow,
  Total,
} from "./styles";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import CustomSelect from "../../../../../global/common/CustomSelect";
import InvestorsSearch from "../../../../../global/common/InvestorsSearch";
import MainModal from "../../../../../global/common/MainModal";
import {
  Actions,
  ResetButton,
} from "../../../../../global/UniversalFilter/styles";
import { Action } from "../../../../../global/LeftNav/styles";
import CurrenciesDropdown, {
  ICurrency,
} from "../../../../../global/common/CurrenciesDropdown";
import {
  currenciesList,
  investingRounds,
} from "../../../../../../staticContent/global";
import CustomNumberInput from "../../../../../global/common/components_for_modals/custom_number_input";
import { InputError } from "../../../modals/CreateOwnAsset/styles";

interface Props {
  isAddRoundModal?: boolean;
  project?: IProject | null;
  onChange: (items: Array<IFundingRound>) => void;
  onClose: () => void;
}

export const defaultState: IFundingRound = {
  icon: "selected",
  investors: [],
  tokenPrice: 0,
  tokenSold: 0,
  totalSupply: 0,
  preValuation: 0,
  platformName: "",
  platformImg: "",
  distributionType: "",
  usdRoi: 0,
  btcRoi: 0,
  ethRoi: 0,
  athRoi: 0,
  currenciesList: [],
  tokenAllocated: 0,
};

const AddRoundModal: FC<Props> = ({
  onClose,
  onChange,
  project,
  isAddRoundModal,
}) => {
  const dispatch = useDispatch();
  const location: string = useProjectPath() || "projects";
  const [currencySearch, setCurrencySearch] = useState<string>("");
  const [data, setData] = useState<IFundingRound>(defaultState);
  const [errors, setErrors] = useState<Array<string>>([]);

  const inputsHandler = (value: any, name?: string): void => {
    if (!name) return;

    setData({ ...data, [name]: value });
  };

  const currenciesHandler = (item: ICurrency): void => {
    const isIncludes: boolean = !!data.currenciesList.find(
      (currency: ICurrency) => currency.name === item.name
    );

    const updatedCurrencies: Array<ICurrency> = isIncludes
      ? data.currenciesList.filter(
          (currency: ICurrency) => currency.name !== item.name
        )
      : [item, ...data.currenciesList];

    setData((prev: IFundingRound) => {
      return { ...prev, currenciesList: updatedCurrencies };
    });
  };

  const determineRoundIcon = (
    startDate?: Date,
    endDate?: Date
  ): "selected" | "privateSell" | "hourGlass" => {
    const now = new Date();

    if (!startDate || !endDate) return "hourGlass";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < now) return "selected";
    if (start > now) return "hourGlass";
    if (start <= now && now <= end) return "privateSell";

    return "selected";
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

    const invalidFields: string[] = [];

    requiredFields.forEach((field) => {
      const value = data[field];
      if (!value) {
        invalidFields.push(field);
      }
    });

    setTimeout(() => {
      setErrors([]);
    }, 4000);

    return invalidFields;
  };

  const confirmChanges = async (): Promise<void> => {
    const invalidFields = validateFundingRound(data);

    if (invalidFields.length > 0) {
      setErrors(invalidFields);
      return;
    }

    const icon: "selected" | "privateSell" | "hourGlass" = determineRoundIcon(
      data.startDate,
      data.endDate
    );

    const updatedFundraising: Array<IFundingRound> = project?.fundraising
      ?.length
      ? [{ ...data, icon }, ...project.fundraising]
      : [{ ...data, icon }];

    onChange(updatedFundraising);

    setData(defaultState);

    onClose();
  };

  return (
    <MainModal
      className="share-modal"
      isVisible={!!isAddRoundModal}
      title="Add Funding Round"
      onClose={onClose}
      variant="820"
    >
      <ModalRow style={{ marginTop: "20px" }}>
        <p style={{ marginBottom: "12px" }}>Investors</p>
        <InvestorsSearch
          className="light-gray"
          investors={data.investors}
          onChange={(investors: Array<any>) => setData({ ...data, investors })}
        />
      </ModalRow>
      <HeaderWrapper>
        <ModalRow>
          <p>Round Type</p>
          <CustomSelect
            placeholder="Select investing round"
            onChange={(value: any) => setData({ ...data, type: value })}
            options={[]}
            optionsWithSection={investingRounds}
          />
          {errors.includes("type") ? (
            <InputError style={{ marginTop: "12px" }}>
              Oops! Looks like you missed the round type.
            </InputError>
          ) : (
            <></>
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
            onChange={(value: any) => inputsHandler(value, "startDate")}
          />
          {errors.includes("startDate") ? (
            <InputError style={{ marginTop: "12px" }}>
              Almost there! Just pick a date.
            </InputError>
          ) : (
            <></>
          )}
        </FundingWrapper>
        <FundingWrapper>
          <p>End Date</p>
          <ModalDatePicker
            type="small"
            date={data.endDate}
            onChange={(value: any) => inputsHandler(value, "endDate")}
          />
          {errors.includes("endDate") ? (
            <InputError style={{ marginTop: "12px" }}>
              Almost there! Just pick a date.
            </InputError>
          ) : (
            <></>
          )}
        </FundingWrapper>
        <CustomNumberInput
          icon="dollar"
          name="minInvestment"
          placeholder="Enter minimum amount"
          label="Min Investment"
          value={data.minInvestment || 0}
          onChange={inputsHandler}
        />
        <CustomNumberInput
          icon="dollar"
          name="maxInvestment"
          placeholder="Enter maximum amount"
          label="Max Investment"
          value={data.maxInvestment || 0}
          onChange={inputsHandler}
        />
        <CustomNumberInput
          icon="dollar"
          name="preValuation"
          placeholder="Enter maximum amount"
          label="Pre-Valuation"
          value={data.preValuation}
          onChange={inputsHandler}
        />
        <ModalRow>
          <InputWithLabel
            placeholder="Solana"
            type="text"
            name="platformName"
            label="Platform"
            isError={errors.includes("platformName")}
            value={String(data.platformName)}
            errorText="Please specify the platform used for this round"
            onChange={(value: any, name?: string) =>
              setData({ ...data, platformName: value })
            }
          />
        </ModalRow>
      </HeaderWrapper>
      <CurrenciesDropdown
        className="marginTop"
        label="Accepted Currencies"
        placeholder="Search currency or select"
        options={currenciesList}
        values={data.currenciesList || []}
        onChange={(value) => currenciesHandler(value)}
        searchValue={currencySearch}
        onSearch={(value: string) => setCurrencySearch(value)}
      />
      <HeaderWrapper style={{ marginTop: "20px" }}>
        <CustomNumberInput
          icon="SRC"
          name="tokenAllocated"
          placeholder="Enter number of tokens allocated"
          label="Tokens Allocated"
          value={data.tokenAllocated}
          onChange={inputsHandler}
          isPrice={false}
        />
        <FundingWrapper>
          <p>Unlock Date</p>
          <ModalDatePicker
            type="small"
            date={data.unlockDate}
            onChange={(value: any) => inputsHandler(value, "unlockDate")}
          />
        </FundingWrapper>
      </HeaderWrapper>
      <Actions style={{ marginTop: "20px" }}>
        <Action onClick={onClose} actionType="red">
          Cancel
        </Action>
        <Button onClick={confirmChanges} variant="primary">
          Save
        </Button>
      </Actions>
      <ResetButton>
        <button
          onClick={() => {
            setData(defaultState);
          }}
        >
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
      {/* <AddRoundBtn>
                <Button
                    variant={'primary'}
                    onClick={confirmChanges}>
                    Save
                </Button>
            </AddRoundBtn> */}
    </MainModal>
  );
};

export default AddRoundModal;
