import React, { FC, useEffect, useState } from "react";
import Tabs from "../../../../../global/Tabs";
import {
  CustomInputWithSelect,
  InputsWrapper,
  InputWrapper,
  TabsWrapper,
  TextareaWrapper,
  Wrapper,
} from "./styles";
import Input from "../../../../../global/common/Input";
import { InputError } from "../styles";
import CustomSelect from "../../../../../global/common/CustomSelect";
import {
  DateContainer,
  DatePickerWrapper,
  DateRow,
} from "../../CreateDealModal/styles";
import ModalDatePicker from "../../../../../global/common/components_for_modals/modal_date_picker";
import TimeInput from "../../../../../global/EventTimeInput/TimeInput";
import Button from "../../../../../global/common/Button";
import { ISecondStepData } from "..";
import {
  Actions,
  ResetButton,
} from "../../../../../global/UniversalFilter/styles";
import { Action } from "../../../../../global/LeftNav/styles";
import addDateAndTime from "../../../../../../helpers/addDateAndTime";

export const defaultState: ISecondStepData = {
  amount: 0,
  price: 0,
  date: new Date(),
  totalPrice: 0,
  fee: 0,
  note: "",
  priceCurrency: "USD",
  type: "usd",
  feeType: "percent",
};

interface IProps {
  modalBack: () => void;
  onConfirm: (data: ISecondStepData) => Promise<boolean>;
  validationErrors: Array<string>;
  initialData: ISecondStepData | null;
  assetTicker?: string;
}

const getTimeFromDate = (date?: Date | string) => {
  const sourceDate = date ? new Date(date) : new Date();

  return {
    hours: String(sourceDate.getHours()).padStart(2, "0"),
    minutes: String(sourceDate.getMinutes()).padStart(2, "0"),
  };
};

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);

  return Number.isNaN(parsed) ? 0 : parsed;
};

const SecondStep: FC<IProps> = ({
  modalBack,
  onConfirm,
  validationErrors,
  initialData,
  assetTicker,
}) => {
  const [priceTab, setPriceTab] = useState<string>("Market Price");
  const [selectedTab, setSelectedTab] = useState<"Buy" | "Sell">("Buy");
  const [stepData, setStepData] = useState<ISecondStepData>(defaultState);
  const [time, setTime] = useState(getTimeFromDate());
  const [feeInputValue, setFeeInputValue] = useState(String(defaultState.fee));
  const [isFeeInvalid, setIsFeeInvalid] = useState(false);
  const [isDateInputValid, setIsDateInputValid] = useState(true);
  const amountTicker = assetTicker?.trim() || "BTC";

  const calcTotal = (amount: number, price: number, fee: number, feeType: string) => {
    const safeAmount = toSafeNumber(amount);
    const safePrice = toSafeNumber(price);
    const safeFee = toSafeNumber(fee);
    const base = safeAmount * safePrice;

    return feeType === "percent"
      ? base + (base * safeFee) / 100
      : base + safeFee;
  };

  const updateTotal = (updated: Partial<ISecondStepData>) => {
    setStepData(prev => {
      const newValues: any = { ...prev, ...updated };
      return {
        ...newValues,
        totalPrice: calcTotal(
          toSafeNumber(newValues.amount),
          toSafeNumber(newValues.price),
          toSafeNumber(newValues.fee),
          newValues.feeType
        ),
      };
    });
  };

  const handleFeeChange = (value: string) => {
    if (!/^\d*([.,]\d*)?$/.test(value)) {
      setIsFeeInvalid(true);
      return;
    }

    setFeeInputValue(value);

    const normalizedValue = value.replace(",", ".");

    if (!normalizedValue) {
      setIsFeeInvalid(false);
      updateTotal({ fee: 0 });
      return;
    }

    if (normalizedValue === ".") {
      setIsFeeInvalid(false);
      return;
    }

    const parsedFee = Number(normalizedValue);

    if (Number.isNaN(parsedFee)) {
      setIsFeeInvalid(true);
      return;
    }

    setIsFeeInvalid(false);
    updateTotal({ fee: parsedFee });
  };

  useEffect(() => {
    if (!initialData) {
      setTime(getTimeFromDate());
      setFeeInputValue(String(defaultState.fee));
      setIsFeeInvalid(false);
      setIsDateInputValid(true);
      return;
    }

    setStepData(prev => ({
      ...prev,
      price: initialData.price,
      amount: initialData.amount,
      totalPrice: initialData.totalPrice,
      fee: initialData.fee,
    }));

    setTime(getTimeFromDate(initialData.date));
    setFeeInputValue(String(initialData.fee ?? 0));
    setIsFeeInvalid(false);
    setIsDateInputValid(true);
  }, [initialData]);

  return (
    <Wrapper>
      <TabsWrapper>
        <Tabs
          className="main"
          activeItem={selectedTab}
          items={["Buy", "Sell"]}
          onClick={(tab: any) => setSelectedTab(tab)}
        />
      </TabsWrapper>

      <InputsWrapper>
        {/* Amount */}
        <InputWrapper>
          <p className="input-label">Amount</p>
          <Input
            className="asset-input"
            placeholder="0"
            type="number"
            rightLabel={amountTicker}
            value={String(stepData.amount)}
            onChange={(value: any) => updateTotal({ amount: Number(value) })}
          />
          {validationErrors.includes("amount") && (
            <InputError>
              Oops! Don’t forget to enter the amount you’d like to trade.
            </InputError>
          )}
        </InputWrapper>

        {/* Price */}
        <InputWrapper>
          <p className="input-label">Price</p>
          <CustomInputWithSelect>
            <input
              type="number"
              className="input-custom"
              placeholder="0"
              value={String(stepData.price)}
              onChange={(e: any) => updateTotal({ price: Number(e.target.value) })}
            />
            <CustomSelect
              className="input-select"
              placeholder="USD"
              options={[
                { value: "USD", label: "USD" },
                { value: "ETH", label: "ETH" },
              ]}
              onChange={(value: string) => updateTotal({ priceCurrency: value })}
            />
          </CustomInputWithSelect>
          {selectedTab === "Sell" && (
            <Tabs
              onClick={(tab: string) => setPriceTab(tab)}
              className="secondary"
              items={["Market Price", "Custom Price", "ICO Price"]}
              activeItem={priceTab}
            />
          )}

          {validationErrors.includes("price") && (
            <InputError>
              Almost there! Just add the price to proceed.
            </InputError>
          )}
        </InputWrapper>

        {/* Date */}
        <InputWrapper>
          <p className="input-label">Date & Time</p>
          <DateRow>
            <DateContainer>
              <DatePickerWrapper>
                <ModalDatePicker
                  type="small"
                  maxDate={new Date()}
                  date={stepData.date}
                  onChange={(value: any) => updateTotal({ date: value })}
                  onValidityChange={setIsDateInputValid}
                />
              </DatePickerWrapper>
              <TimeInput
                className="create-own-asset-time-input"
                initial={time}
                handler={(value: any) => setTime(value)}
              />
            </DateContainer>
          </DateRow>
          {validationErrors.includes("date") && (
            <InputError>Almost there! Just pick a date and time.</InputError>
          )}
        </InputWrapper>

        {/* Total */}
        <InputWrapper>
          <p className="input-label">Total Price</p>
          <Input
            className="asset-input"
            placeholder="0.00"
            type="number"
            rightLabel="USD"
            value={String(stepData.totalPrice.toFixed(2))}
            onChange={(value: string) => updateTotal({ totalPrice: Number(value) })}
          />
        </InputWrapper>

        {/* Note */}
        <TextareaWrapper>
          <p className="input-label">Note</p>
          <textarea
            value={stepData.note}
            onChange={(e: any) => {
              if (e.target.value.length > 300) return;
              updateTotal({ note: e.target.value });
            }}
            placeholder="Want to add extra info? Type it here (Optional)"
          />
          <p className="input-bottom-label">300 Characters Max</p>
        </TextareaWrapper>

        {/* Fee */}
        <InputWrapper>
          <p className="input-label">Fee</p>
          <CustomInputWithSelect>
            <input
              type="text"
              inputMode="decimal"
              value={feeInputValue}
              onChange={(e: any) => handleFeeChange(e.target.value)}
              onBlur={() => {
                if (!feeInputValue || feeInputValue === ".") {
                  setFeeInputValue("0");
                  setIsFeeInvalid(false);
                  updateTotal({ fee: 0 });
                }
              }}
              className="input-custom"
              placeholder="0.00"
            />
            <CustomSelect
              className="input-select"
              placeholder="%"
              options={[
                { value: "percent", label: "%" },
                { value: "usd", label: "USD" },
              ]}
              onChange={(value: any) => updateTotal({ feeType: value })}
            />
          </CustomInputWithSelect>
          {isFeeInvalid && (
            <InputError>Please enter a valid number for the fee.</InputError>
          )}
          <p className="input-bottom-label">
            Set your fee – we’ll add it to the final sum!
          </p>
        </InputWrapper>
      </InputsWrapper>

      <Actions>
        <Action onClick={modalBack} actionType="red">Back</Action>

        <Button
          disabled={!isDateInputValid}
          onClick={() => {
            if (!stepData.date || !isDateInputValid) return;
            onConfirm({
              ...stepData,
              type: selectedTab.toLowerCase(),
              date: new Date(
                addDateAndTime(stepData.date, `${time.hours}:${time.minutes}`)
              ),
            }).then((isSuccess: boolean) => {
              if (isSuccess) {
                setStepData({ ...defaultState, date: new Date() });
                setTime(getTimeFromDate());
                setFeeInputValue(String(defaultState.fee));
                setIsFeeInvalid(false);
                setIsDateInputValid(true);
              }
            });
          }}
          variant="primary"
        >
          Send Transaction
        </Button>
      </Actions>

      <ResetButton>
        <button
          onClick={() => {
            setStepData({ ...defaultState, date: new Date() });
            setTime(getTimeFromDate());
            setFeeInputValue(String(defaultState.fee));
            setIsFeeInvalid(false);
            setIsDateInputValid(true);
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
    </Wrapper>
  );
};

export default SecondStep;
