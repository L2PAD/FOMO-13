import React, { FC, useContext, useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import { ICreateDeal, IDeal } from "../../../../../types/global_types";
import addDateAndTime from "../../../../../helpers/addDateAndTime";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import CustomSelect from "../../../../global/common/CustomSelect";
import {
  ButtonsWrapper,
  DateWrapper,
  MessageWrapper,
  SubmitButton,
  ThemeWrapper,
  DatePickerWrapper,
  CheckboxWrapper,
  DateContainer,
  DealInputLabel,
  InputsRow,
  PriceInput,
  ServiceWrapper,
  AmountWrapper,
  CurrencyWrapper,
  DateRow,
  OfferType,
  Buttons,
} from "./styles";
import { oneWeekInMs } from "../../../../global/Filter/otc_filter";
import { ResetWrapper } from "../../../../global/Filter/otc-styles";
import { Button } from "../../../../global/common/Button";
import { RotateCcw } from "lucide-react";
import MainModal from "../../../../global/common/MainModal";
import { LoadingContext } from "../../../../global/Layout";
import { errorsInitial } from "../CreateDealModal";
import TimeInput from "../../../../global/EventTimeInput/TimeInput";
import { InputError } from "../CreateOwnAsset/styles";
import InputWithLabel, { ErrorContainer, INPUT_ERROR_TIME } from "../../../../global/common/components_for_modals/input_with_label";
import LottieError from '../../../../../assets/animations/error.json'
import CustomNumberInput from "../../../../global/common/components_for_modals/custom_number_input";
import createDeal from "../../../../../http/otc/createDeal";
import { createDealWithApproval } from "../../../../../smart/smartOTCP2P";
import dynamic from "next/dynamic";

const Lottie = dynamic(
  () => import("../../../../global/LottieClient/index"),
  { ssr: false }
);


interface Props {
  refetchDeals?: any;
  dealDataInitial?: IDeal | null;
  isVisible: boolean
  onClose: () => void;
}

const ServicesTypes = [
  {
    value: "Services",
    label: "Services",
  },
  {
    value: "NFT",
    label: "NFT",
  },
  {
    value: "Project Account",
    label: "Project Account",
  },
  {
    value: "KYC",
    label: "KYC",
  },
  {
    value: "Projects",
    label: "Projects",
  },
];

const formatTimeInput = (value: string): string => {
  if (value.includes(":")) {
    const [hours, minutes] = value.split(":");

    let validHours = hours.replace(/[^\d]/g, "");
    if (validHours.length > 0 && parseInt(validHours) > 23) {
      validHours = "23";
    }
    validHours = validHours.padStart(2, "0").substring(0, 2);

    let validMinutes = minutes ? minutes.replace(/[^\d]/g, "") : "";
    if (validMinutes.length > 0 && parseInt(validMinutes) > 59) {
      validMinutes = "59";
    }
    validMinutes = validMinutes.padStart(2, "0").substring(0, 2);

    return `${validHours}:${validMinutes}`;
  }

  const digits = value.replace(/[^\d]/g, "");

  if (digits.length <= 2) {
    let validHours = digits;
    if (digits.length === 2 && parseInt(digits) > 23) {
      validHours = "23";
    }
    return validHours;
  } else {
    const hours = digits.substring(0, 2);
    let validHours = parseInt(hours) > 23 ? "23" : hours;

    let minutesDigits = digits.substring(2);
    if (minutesDigits.length > 0 && parseInt(minutesDigits) > 59) {
      minutesDigits = "59";
    }
    minutesDigits = minutesDigits.substring(0, 2);

    return `${validHours}:${minutesDigits}`;
  }
};

const CreateOfferModal: FC<Props> = ({
  onClose,
  dealDataInitial,
  refetchDeals,
  isVisible
}) => {
  const { loadingStateHandler } = useContext(LoadingContext)
  const [checkChoice, setCheckChoice] = useState(false);
  const [errors, setErrors] = useState(errorsInitial);
  const [time, setTime] = useState<{ hours: string, minutes: string }>(
    dealDataInitial
      ? {
        hours: String(new Date(dealDataInitial?.date || new Date()).getHours()).padStart(2, "0"),
        minutes: String(new Date(dealDataInitial?.date || new Date()).getMinutes()).padStart(2, "0")
      }
      : {
        hours: '',
        minutes: ''
      }
  );
  const [dealData, setDealData] = useState<ICreateDeal>({
    type: "sell",
    name: "",
    amount: 1,
    price: 0.0,
    ticker: "eth",
    date: new Date(Date.now() + oneWeekInMs),
    description: "",
    dealId: 0,
    creator: "",
    movingTokens: false,
    serviceType: "Services",
    buyer: "",
  });

  useEffect(() => {
    if (dealDataInitial) {
      const initialTime = dealDataInitial.date
        ?
        {
          hours: String(new Date(dealDataInitial?.date || new Date()).getHours()).padStart(2, "0"),
          minutes: String(new Date(dealDataInitial?.date || new Date()).getMinutes()).padStart(2, "0")
        }
        : { hours: '', minutes: '' };

      setTime(initialTime);

      setDealData({
        type: dealDataInitial.type === "buy" ? "sell" : "buy",
        name: dealDataInitial.name || "",
        amount: dealDataInitial.amount || 1,
        price: dealDataInitial.price || 0.0,
        ticker: dealDataInitial.ticker || "eth",
        date: new Date(dealDataInitial.date || Date.now() + oneWeekInMs),
        description: dealDataInitial.description || "",
        dealId: dealDataInitial.dealId || 0,
        movingTokens: dealDataInitial.movingTokens || false,
        serviceType: dealDataInitial.serviceType || "Services",
        buyer: "",
        creator: ''
      });

      setCheckChoice(dealDataInitial.movingTokens || false);
    } else {
      setTime({ hours: '', minutes: '' });
      setDealData({
        type: "sell",
        name: "",
        amount: 1,
        price: 0.0,
        ticker: "eth",
        date: new Date(Date.now() + oneWeekInMs),
        description: "",
        dealId: 0,
        creator: "",
        movingTokens: false,
        serviceType: "Services",
        buyer: "",
      });
      setCheckChoice(false);
    }
  }, [dealDataInitial]);

  const inputsHandler = (value: any, name: string): void => {
    setDealData((prev: ICreateDeal) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const validateDealData = (): boolean => {
    let isValid = true
    const errors: any = {}
    const isNameValid = dealData.name.length > 2
    const isSmartRequired = dealData.isRealAsset && !!dealData?.smartContract?.length
    const isSmartValid = isSmartRequired ? (dealData?.smartContract?.length || 0) > 10 : false

    if (!isNameValid) {
      isValid = false
      errors.name = 'This field required!'
    }

    if (dealData.isRealAsset && !dealData?.smartContract?.length) {
      isValid = false
      errors.smartContract = 'This field required!'
    }

    if (isSmartRequired && !isSmartValid) {
      isValid = false
      errors.smartContract = 'Invalid address format.'
    }

    if (!dealData.price) {
      isValid = false
      errors.price = 'Required!'
    }

    if (!dealData.amount) {
      isValid = false
      errors.amount = 'Required!'
    }

    if (!time.minutes || !dealData.date) {
      isValid = false
      errors.date = 'Almost there! Just pick a date and time.'
    }

    setErrors(errors)

    setTimeout(() => {
      setErrors(errorsInitial)
    }, INPUT_ERROR_TIME)

    return isValid
  }

  const confirmCreateDeal = async (): Promise<void> => {
    const isValid: boolean = validateDealData()

    if (!isValid || !dealData.date || !dealData.ticker) return

    loadingStateHandler(true)

    const hours = time.hours || "00";
    const minutes = time.minutes || "00";
    const timeString = `${hours}:${minutes}`;

    const dealDate: number = new Date(
      addDateAndTime(dealData.date, timeString)
    )?.getTime();

    let dealId: number | null = null;

    if (dealData.isRealAsset) {
      toast.error('Decimals required!')
      return
    }

    if (!dealDate) {
      toast.error('Invalid Date!')
      return
    }

    if (dealData.type === "sell") {
      const { id, success } = await createDealWithApproval({
        endTime: dealDate / 1000,
        price: dealData.price,
        currency: dealData.ticker.toLowerCase() === 'eth' ? 0 : 1,
        mode: dealData.isRealAsset ? 0 : 1,
        tokenAmount: dealData.isRealAsset ? dealData.amount : 0,
        tokenForSale: dealData.isRealAsset ? dealData.smartContract : '',
      })

      if (!success) {
        toast.error(
          <div>
            <h3>Something went wront...</h3>
            <p>Smart contract error!</p>
          </div>
        )
      }

      dealId = id
    }

    const { isSuccess } = await createDeal(
      {
        ...dealData,
        ticker: dealData.ticker.toLowerCase() === "eth" ? "eth" : "usd",
        date: new Date(dealDate),
        movingTokens: false,
        dealId: dealId,
      },
      true,
      dealDataInitial?._id || ""
    );

    if (isSuccess) {
      refetchDeals && (await refetchDeals());
      toast.success(
        <div>
          <h3>Your offer has been sent!</h3>
          <p>Wait for confirmation from the buyer/seller</p>
        </div>
      );
    }

    loadingStateHandler(false)
    handleReset()
    onClose();
  };

  const handleReset = (): void => {
    if (dealDataInitial) {
      const initialTime = dealDataInitial.date
        ?
        {
          hours: String(new Date(dealDataInitial?.date || new Date()).getHours()).padStart(2, "0"),
          minutes: String(new Date(dealDataInitial?.date || new Date()).getMinutes()).padStart(2, "0")
        }
        : { hours: '', minutes: '' };

      setTime(initialTime);

      setDealData({
        type: dealDataInitial.type === "buy" ? "sell" : "buy",
        name: dealDataInitial.name || "",
        amount: dealDataInitial.amount || 1,
        price: dealDataInitial.price || 0.0,
        ticker: dealDataInitial.ticker || "eth",
        date: new Date(dealDataInitial.date || Date.now() + oneWeekInMs),
        description: dealDataInitial.description || "",
        dealId: dealDataInitial.dealId || 0,
        creator: "",
        movingTokens: dealDataInitial.movingTokens || false,
        serviceType: dealDataInitial.serviceType || "Services",
        buyer: "",
      });

      setCheckChoice(dealDataInitial.movingTokens || false);
    } else {
      setDealData({
        type: "buy",
        name: "",
        amount: 1,
        price: 0.0,
        ticker: "eth",
        date: new Date(Date.now() + oneWeekInMs),
        description: "",
        dealId: 0,
        creator: "",
        movingTokens: false,
        serviceType: "Services",
        buyer: "",
      });
      setTime({ hours: "", minutes: '' });
      setCheckChoice(false);
    }
  };

  const isValid: boolean = useMemo(() => {
    if (!dealData.price || !dealData.amount || !dealData.name) return false;

    return true;
  }, [dealData]);

  return (
    <MainModal
      variant="deal"
      className="deal-modal"
      onClose={onClose}
      title="Terms of the Offer"
      isVisible={isVisible}
    >
      <br />
      <InputsRow>
        <CustomNumberInput
          name="amount"
          placeholder="Enter amount"
          label="Amount"
          value={dealData.amount}
          onChange={(value: number) => inputsHandler(value, "amount")}
          isPrice={false}
          isError={!!errors.amount}
          errorText={errors.amount}
        />
        <CustomNumberInput
          name="price"
          placeholder="Enter price"
          label="Price"
          value={dealData.price}
          onChange={(value: number) => inputsHandler(value, "price")}
          isPrice={true}
          isError={!!errors.price}
          errorText={errors.price}
        />
        <CurrencyWrapper>
          <DealInputLabel>Currency</DealInputLabel>
          <CustomSelect
            className="currency-select"
            placeholder="ETH"
            options={[
              { value: "eth", label: "ETH" },
              { value: "usdc", label: "USDC" },
            ]}
            onChange={(value: string) => inputsHandler(value, "ticker")}
          />
        </CurrencyWrapper>
      </InputsRow>
      <DateWrapper>
        <DealInputLabel>Date and Time</DealInputLabel>
        <DateRow>
          <DateContainer>
            <DatePickerWrapper>
              <ModalDatePicker
                type="small"
                date={dealData.date}
                onChange={(value: any) => inputsHandler(value, "date")}
              />
            </DatePickerWrapper>
            <TimeInput
              initial={time}
              handler={(value) => setTime(value)}
            />
          </DateContainer>
        </DateRow>
        {
          errors.date
            ?
            <ErrorContainer>
              <Lottie animationData={LottieError} />
              <InputError>{errors.date}</InputError>
            </ErrorContainer>
            :
            <></>
        }
      </DateWrapper>
      <MessageWrapper>
        <DealInputLabel className="description-label">Message</DealInputLabel>
        <textarea
          value={dealData.description}
          onChange={(e: any) => inputsHandler(e.target.value, "description")}
          placeholder="Enter deal description"
        />
        <span>300 Characters Max</span>
      </MessageWrapper>
      <Buttons>
        <div className="default">
          <Button onClick={onClose} className="red-btn big">
            Cancel
          </Button>
          <Button
            disabled={!isValid}
            onClick={confirmCreateDeal}
            variant="primary"
            className="big"
          >
            Create Offer
          </Button>
        </div>
        <ResetWrapper className="big reset">
          <Button onClick={handleReset} className={`reset-btn small`}>
            <RotateCcw size={16} />
            Reset
          </Button>
        </ResetWrapper>
      </Buttons>
    </MainModal>
  );
};

export default CreateOfferModal;